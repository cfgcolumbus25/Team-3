import { useState } from "react";
import { Bell, User, LogOut, Settings, HelpCircle, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
                <img 
                src="/ModernStates.png"       // path to PNG in the public folder
                alt="Modern States Logo" 
                className="h-12 w-16"        // match the size of the logo
                />
                <span className="font-bold text-lg">Modern States</span>
            </Link>
            {user?.institution && (
                <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">{user.institution.name}</span>
                </>
            )}
            </div>
        </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <Input
                  placeholder="Search..."
                  className="w-64"
                  onBlur={() => setSearchOpen(false)}
                  autoFocus
                />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="hover:bg-accent"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative hover:bg-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user?.name || user?.email}</p>
                  {user?.institution && (
                    <p className="text-xs text-muted-foreground">{user.institution.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">{user?.role} Account</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
