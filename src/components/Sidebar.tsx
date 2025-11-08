import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Database, 
  FileText, 
  Settings, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  role: "admin" | "institution";
}

export const Sidebar = ({ role }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const adminLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: FileText, label: "Reports", href: "/admin/reports" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  const institutionLinks = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/institution" },
    { icon: Database, label: "Manage Data", href: "/institution/data-management" },
    { icon: FileText, label: "Reports", href: "/institution/reports" },
    { icon: Settings, label: "Settings", href: "/institution/settings" },
  ];

  const links = role === "admin" ? adminLinks : institutionLinks;

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => (
            <NavLink
                key={link.href}
                to={link.href}
                end={link.href === "/admin" || link.href === "/institution"} // exact match for dashboard
                className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-gradient-primary text-primary-foreground shadow-glow border-l-4 border-primary",
                    collapsed && "justify-center"
                )
                }
            >
                {({ isActive }) => (
                <>
                    <link.icon className={cn("h-5 w-5", isActive && "animate-pulse")} />
                    {!collapsed && <span>{link.label}</span>}
                </>
                )}
          </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full hover:bg-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};
