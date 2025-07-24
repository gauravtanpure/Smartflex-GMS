import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Dumbbell,
  FileText,
  ChevronLeft,
  User,
  GitBranch, // Import GitBranch for Manage Branches icon
} from "lucide-react";
import { cn } from "@/lib/utils";


const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Trainers", icon: Users, href: "/trainers" },
  { title: "My Attendance", icon: Calendar, href: "/attendance" },
  { title: "My Fees", icon: CreditCard, href: "/fees" },
  { title: "My Exercise", icon: Dumbbell, href: "/exercise" },
  { title: "My Diet Sheet", icon: FileText, href: "/diet" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [branch, setBranch] = useState(""); // State to store the branch
  const location = useLocation();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const storedBranch = localStorage.getItem("branch");

    console.log("🔍 Retrieved role:", role); // Helps in debugging
    console.log("🔍 Retrieved branch:", storedBranch); // Helps in debugging

    if (storedUsername) setUsername(storedUsername);
    setIsSuperAdmin(role === "superadmin"); // Set boolean directly
    setIsAdmin(role === "admin");         // Set boolean directly
    if (storedBranch) setBranch(storedBranch);
  }, []);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-300",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="/logo2.png"
                alt="SmartFlex Fitness Logo"
                className="w-auto h-8"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {item.title}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Conditional rendering for Manage Trainers for 'admin' role */}
          {isAdmin && (
            <NavLink
              to="/manage-trainers"
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-trainers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-foreground hover:text-foreground"
              )}
            >
              <Users className="w-5 h-5 flex-shrink-0" /> {/* Reusing Users icon, or pick a new one */}
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Manage Trainers
                </span>
              )}
            </NavLink>
          )}

          {/* Conditional rendering for Manage Branches for 'superadmin' role */}
          {isSuperAdmin && (
            <NavLink
              to="/manage-branches"
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-branches"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-foreground hover:text-foreground"
              )}
            >
              <GitBranch className="w-5 h-5 flex-shrink-0" /> {/* Using GitBranch icon */}
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Manage Branches
                </span>
              )}
            </NavLink>
          )}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className={cn("flex items-center space-x-3 p-3 rounded-lg bg-muted/50", collapsed && "justify-center")}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{username || "User"}</p>
                <p className="text-xs text-muted-foreground">
                    {isSuperAdmin ? "Super Admin" : isAdmin ? `Admin (${branch || 'No Branch'})` : "Member"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}