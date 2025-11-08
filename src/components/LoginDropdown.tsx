import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const LoginDropdown = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative inline-block text-left">
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none"
      >
        Login
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <button
            onClick={() => { navigate("/learner"); setOpen(false); }}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            For Learners
          </button>
          <button
            onClick={() => { navigate("/login/institution"); setOpen(false); }}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            For Institutions
          </button>
          <button
            onClick={() => { navigate("/login/admin"); setOpen(false); }}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Admin Login
          </button>
        </div>
      )}
    </div>
  );
};