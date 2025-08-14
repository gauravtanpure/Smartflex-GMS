// src/components/Sidebar.tsx
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Dumbbell,
  ChevronLeft,
  User,
  GitBranch,
  UserCheck,
  Clock,
  HeartPulse,
  Salad,
  Award,
  CircleCheck,
  Plane, // ⬅️ NEW ICON
  PlaneTakeoff, // ⬅️ NEW ICON
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
          className="fixed inset-0 z-30 bg-black/50 lg:hidden "
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 h-14">

          {!collapsed && (
            <div className="flex items-center space-x-2">
              <img
                src="/logo2.png"
                alt="SmartFlex Fitness Logo"
                className="w-auto h-12"
              />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform text-gray-500",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        <nav className="p-3 space-y-1" font-poppins>
          <NavLink
            to="/dashboard"
            onClick={onMobileClose}
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              location.pathname === "/dashboard"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <LayoutDashboard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/dashboard" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
            {!collapsed && (
              <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                Dashboard
              </span>
            )}
          </NavLink>

          {/* {(isAdmin) && (
            <NavLink
              to="/admin-analytics"
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/admin-analytics"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <LayoutDashboard
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  location.pathname === "/admin-analytics"
                    ? "text-primary-foreground"
                    : "text-gray-500 group-hover:text-gray-700"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Analytics
                </span>
              )}
            </NavLink>
          )} */}

          {(isAdmin) && (
            <NavLink
              to="/manage-fees"
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-fees"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <CreditCard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-fees" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Manage Fees
                </span>
              )}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/branch-users"
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/branch-users"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/branch-users" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Branch Users
                </span>
              )}
            </NavLink>
          )}


          {(isAdmin || isSuperAdmin) && (
            <NavLink
              to="/manage-membership-plans"
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/manage-membership-plans"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Award className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-membership-plans" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Manage Membership Plans
                </span>
              )}
            </NavLink>
          )}

          {isMember && (
            <>
              <NavLink
                to="/attendance"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Calendar className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/attendance" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    My Attendance
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/fees"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/fees"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <CreditCard className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/fees" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    My Fees
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/my-exercise"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/my-exercise"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <HeartPulse className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/my-exercise" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    My Exercise
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/my-diet"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/my-diet"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Salad className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/my-diet" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    My Diet Plan
                  </span>
                )}
              </NavLink>
            </>
          )}

          {(!isTrainer) && (
            <NavLink
              to="/trainers"
              onClick={onMobileClose}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                location.pathname === "/trainers"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainers" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
              {!collapsed && (
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  Trainers
                </span>
              )}
            </NavLink>
          )}

          {isTrainer && (
            <>
              <NavLink
                to="/trainer/users"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/users"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/users" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    See My Branch Users
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/attendance"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/attendance"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <UserCheck className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/attendance" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Manage Attendance
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/sessions"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/sessions"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Clock className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/sessions" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Manage Sessions
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/assign-diet"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/assign-diet"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Salad className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/assign-diet" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Assign Diet Plan
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/trainer/assign-exercise"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/assign-exercise"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Dumbbell className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/assign-exercise" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Assign Exercise Plan
                  </span>
                )}
              </NavLink>
              {/* ⬅️ New Trainer PTO Request Link */}
              <NavLink
                to="/trainer/pto-request"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/trainer/pto-request"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Plane className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/trainer/pto-request" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Request PTO
                  </span>
                )}
              </NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <NavLink
                to="/manage-trainers"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/manage-trainers"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Users className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-trainers" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Manage Trainers
                  </span>
                )}
              </NavLink>
              {/* ⬅️ New Admin Manage PTO Requests Link */}
              <NavLink
                to="/admin/manage-pto"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/admin/manage-pto"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <PlaneTakeoff className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/admin/manage-pto" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Manage PTO Requests
                  </span>
                )}
              </NavLink>
            </>
          )}

          {isSuperAdmin && (
            <>
              <NavLink
                to="/manage-branches"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/manage-branches"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <GitBranch className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/manage-branches" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Manage Branches
                  </span>
                )}
              </NavLink>
              <NavLink
                to="/approve-trainer-revenue"
                onClick={onMobileClose}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  location.pathname === "/approve-trainer-revenue"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <CircleCheck className={cn("w-5 h-5 flex-shrink-0", location.pathname === "/approve-trainer-revenue" ? "text-primary-foreground" : "text-gray-500 group-hover:text-gray-700")} />
                {!collapsed && (
                  <span className="text-sm font-semibold truncate" style={{ fontFamily: "Montserrat, sans-serif" }}>
                    Approve Trainer Revenue
                  </span>
                )}
              </NavLink>
            </>
          )}
        </nav>

        <div
          className={cn(
            "absolute bottom-4 left-4 right-4",
            isMember ? "cursor-pointer" : "cursor-default"
          )}
          onClick={handleProfileClick}
        >
          <div className={cn("flex items-center space-x-3 p-3 rounded-lg", collapsed ? "justify-center bg-gray-100" : "bg-gray-100")}>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-boldd truncate text-gray-800" style={{ fontFamily: "Montserrat, sans-serif" }}>{username || "User"}</p>
                <p className="text-xs text-gray-500" style={{ fontFamily: "Montserrat, sans-serif" }}>
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