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
  UserCheck,
  Clock,
  ClipboardList, // New icon for Diet/Exercise Assignment - Keep if existing feature
  HeartPulse, // New icon for My Exercise - Keep if existing feature
  Salad, // New icon for My Diet - Keep if existing feature
} from "lucide-react";
import { cn } from "@/lib/utils";


const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [branch, setBranch] = useState("");
  const [profileCompletion, setProfileCompletion] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const role = localStorage.getItem("role");
    const storedBranch = localStorage.getItem("branch");
    const storedProfileCompletion = localStorage.getItem("profile_completion_percentage");

    if (storedUsername) setUsername(storedUsername);
    if (role) setUserRole(role);
    if (storedBranch) setBranch(storedBranch);
    if (storedProfileCompletion) setProfileCompletion(storedProfileCompletion);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedProfileCompletion = localStorage.getItem("profile_completion_percentage");
      setProfileCompletion(storedProfileCompletion);
      // Also update username, role, branch if they can change via storage
      setUsername(localStorage.getItem("username") || "");
      setUserRole(localStorage.getItem("role"));
      setBranch(localStorage.getItem("branch") || "");
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
    // Only members have a profile completion flow
    if (isMember) {
      navigate("/profile-completion");
      if (onMobileClose) {
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
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg", // Lighter background, subtle shadow
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200"> {/* Lighter border */}
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="/logo2.png" // Ensure this path is correct and image exists
                alt="SmartFlex Fitness Logo"
                className="w-auto h-8"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" // Lighter hover
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform text-gray-500", // Ensure icon color
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="p-3 space-y-1"> {/* Adjusted padding and spacing */}
          {/* Dashboard is for everyone */}
          <NavLink
            to="/dashboard"
            onClick={onMobileClose} // Close sidebar on mobile after click
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900" // Adjusted colors for better contrast
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/dashboard" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} /> {/* Icon color adjustment */}
            {!collapsed && (
              <span className="text-sm font-medium truncate">
                Dashboard
              </span>
            )}
          </NavLink>

          {/* Conditional rendering for Manage Fees for 'admin' role */}
          {(isAdmin) && ( // Admin or Superadmin
            <NavLink
              to="/manage-fees"
              onClick={onMobileClose} // Close sidebar on mobile after click
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-fees"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <CreditCard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-fees" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
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
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Calendar className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/attendance" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Attendance
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/fees"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/fees"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <CreditCard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/fees" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Fees
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/my-exercise"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/my-exercise"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <HeartPulse className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/my-exercise" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Exercise
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/my-diet"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/my-diet"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Salad className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/my-diet" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    My Diet Plan
                  </span>
                )}
              </NavLink>
            </>
          )}

          {/* Trainers link: Visible to Members, Admins, Superadmins, but NOT Trainers themselves */}
          {(!isTrainer) && (
            <NavLink
              to="/trainers"
              onClick={onMobileClose} // Close sidebar on mobile after click
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/trainers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainers" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Trainers
                </span>
              )}
            </NavLink>
          )}

          {/* Conditional rendering for Trainer specific options */}
          {isTrainer && (
            <>
              <NavLink
                to="/trainer/users"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/users"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/users" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    See My Branch Users
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/attendance"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <UserCheck className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/attendance" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Manage My Branch Attendance
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/sessions"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/sessions"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Clock className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/sessions" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Manage Sessions
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/assign-diet"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/assign-diet"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Salad className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/assign-diet" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Assign Diet Plan
                  </span>
                  )}
              </NavLink>
              <NavLink
                to="/trainer/assign-exercise"
                onClick={onMobileClose} // Close sidebar on mobile after click
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/assign-exercise"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Dumbbell className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/assign-exercise" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    Assign Exercise Plan
                  </span>
                )}
              </NavLink>
            </>
          )}

          {/* Conditional rendering for Manage Trainers for 'admin' role */}
          {isAdmin && (
            <NavLink
              to="/manage-trainers"
              onClick={onMobileClose} // Close sidebar on mobile after click
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-trainers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-trainers" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
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
              onClick={onMobileClose} // Close sidebar on mobile after click
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-branches"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <GitBranch className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-branches" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  Manage Branches
                </span>
              )}
            </NavLink>
          )}
        </nav>

        {/* User Profile / Role Display at the bottom */}
        <div
          className={cn(
            "absolute bottom-4 left-4 right-4",
            isMember ? "cursor-pointer" : "cursor-default" // Only clickable for members
          )}
          onClick={handleProfileClick}
        >
          <div className={cn("flex items-center space-x-3 p-3 rounded-lg", collapsed ? "justify-center bg-gray-100" : "bg-gray-100")}> {/* Adjusted background */}
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-gray-800">{username || "User"}</p>
                <p className="text-xs text-gray-500"> {/* Ensured text color */}
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