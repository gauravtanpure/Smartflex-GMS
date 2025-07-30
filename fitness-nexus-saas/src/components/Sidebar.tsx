// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom"; // Import useNavigate

import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Dumbbell,
  FileText,
  ChevronLeft,
  User,
  GitBranch,
  UserCheck, // New icon for Manage Attendance
  UserCog, // Icon for Profile Completion (not directly used for link, but good to keep if needed elsewhere)
  Clock, // New icon for Session Management
} from "lucide-react";
import { cn } from "@/lib/utils";


const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  // These routes will be conditionally displayed or restricted based on role
  // For members: My Attendance, My Fees, My Exercise, My Diet Sheet
  // For trainers: Trainer specific (See Users, Manage Attendance)
  // For admins: Manage Trainers
  // For superadmins: Manage Branches
  { title: "Trainers", icon: Users, href: "/trainers" }, // Generally visible for all to see trainers
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null); // Use a single state for role
  const [branch, setBranch] = useState("");
  const [profileCompletion, setProfileCompletion] = useState<string | null>(null); // New state for profile completion
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const storedBranch = localStorage.getItem("branch");
    const storedProfileCompletion = localStorage.getItem("profile_completion_percentage"); // Retrieve completion percentage

    if (storedUsername) setUsername(storedUsername);
    if (role) setUserRole(role);
    if (storedBranch) setBranch(storedBranch);
    if (storedProfileCompletion) setProfileCompletion(storedProfileCompletion);
  }, []);

  // Effect to listen for changes in localStorage for profile completion
  useEffect(() => {
    const handleStorageChange = () => {
      const storedProfileCompletion = localStorage.getItem("profile_completion_percentage");
      setProfileCompletion(storedProfileCompletion);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);


  const isSuperAdmin = userRole === "superadmin";
  const isAdmin = userRole === "admin";
  const isTrainer = userRole === "trainer";
  const isMember = userRole === "member";

  const handleProfileClick = () => {
    if (isMember) { // Only allow members to navigate to profile completion
      navigate("/profile-completion");
      if (onMobileClose) { // Close sidebar on mobile after navigation
        onMobileClose();
      }
    }
  };


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
          {/* Dashboard is for everyone */}
          <NavLink
            to="/dashboard"
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-foreground hover:text-foreground"
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5 flex-shrink-0")} />
            {!collapsed && (
              <span className="text-sm font-medium truncate">
                Dashboard
              </span>
            )}
          </NavLink>

          {/* Conditional rendering for Manage Fees for 'admin' role */}
          {isAdmin && (
            <NavLink
              to="/manage-fees"
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-fees"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-foreground hover:text-foreground"
              )}
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Manage Fees
                </span>
              )}
            </NavLink>
          )}

          {/* Regular user/member menu items */}
          {isMember && (
            <>
              <NavLink
                to="/attendance"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <Calendar className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Attendance
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/fees"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/fees"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <CreditCard className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Fees
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/exercise"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/exercise"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <Dumbbell className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Exercise
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/diet"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/diet"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Diet Sheet
                  </span>
                )}
              </NavLink>
            </>
          )}

          {/* Trainers page is generally visible for members to see trainers,
              and also for admins/superadmins to manage them.
              Trainers themselves might not need to see this, or could see a filtered list.
              For now, let's keep it generally accessible, but define specific trainer views below.
          */}
          <NavLink
            to="/trainers"
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/trainers"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-foreground hover:text-foreground"
            )}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium truncate">
                Trainers
              </span>
            )}
          </NavLink>

          {/* Conditional rendering for Trainer specific options */}
          {isTrainer && (
            <>
              <NavLink
                to="/trainer/users"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/users"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <Users className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    See My Branch Users
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/attendance"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <UserCheck className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Manage My Branch Attendance
                  </span>
                )}
              </NavLink>
              {/* New NavLink for Session Management */}
              <NavLink
                to="/trainer/sessions"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/sessions"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-muted text-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Manage Sessions
                  </span>
                )}
              </NavLink>
            </>
          )}

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
              <Users className="w-5 h-5 flex-shrink-0" />
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
              <GitBranch className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Manage Branches
                </span>
              )}
            </NavLink>
          )}
        </nav>

        <div
          className={cn(
            "absolute bottom-4 left-4 right-4",
            isMember && "cursor-pointer" // Add cursor-pointer for members
          )}
          onClick={handleProfileClick} // Add onClick handler here
        >
          <div className={cn("flex items-center space-x-3 p-3 rounded-lg bg-muted/50", collapsed && "justify-center")}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{username || "User"}</p>
                <p className="text-xs text-muted-foreground">
                    {isSuperAdmin ? "Super Admin" : isAdmin ? `Admin (${branch || 'No Branch'})` : isTrainer ? `Trainer (${branch || 'No Branch'})` : `Member (${profileCompletion || '0'}%)`}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}