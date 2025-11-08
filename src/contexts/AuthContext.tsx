import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getUniversityByDiCode, type University } from "@/lib/universityDatabase";

interface Institution {
  id: number;
  name: string;
  city: string;
  state: string;
  diCode: number; // Changed to number to match University type
}

interface User {
  email: string;
  role: "admin" | "institution";
  institution?: Institution;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: "admin" | "institution", institutionDiCode?: number) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string, role: "admin" | "institution", institutionDiCode?: number): boolean => {
    // Accept any non-empty credentials
    if (!email.trim() || !password.trim()) {
      return false;
    }

    if (role === "admin") {
      const userData = { email, role: "admin" as const, name: "Admin User" };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/admin");
      return true;
    } else {
      if (!institutionDiCode) return false;
      
      // Find university by DI code from the full database (all 57 institutions)
      const university = getUniversityByDiCode(institutionDiCode);
      if (university) {
        // Convert University to Institution format for compatibility
        const institution: Institution = {
          id: university.id,
          name: university.name,
          city: university.city,
          state: university.state,
          diCode: university.diCode,
        };
        
        const userData = { email, role: "institution" as const, institution };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate("/institution");
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
