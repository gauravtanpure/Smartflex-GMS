import { NavLink, useLocation } from "react-router-dom";

import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  Dumbbell, 
  FileText,
  ChevronLeft,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const location = useLocation();
  
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar-bg border-r border-sidebar-border transition-all duration-300",
        // Mobile: slide in/out, Desktop: always visible
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "w-16" : "w-64"
      )}>
      {/* Sidebar Header */}
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
          <ChevronLeft className={cn(
            "w-4 h-4 transition-transform",
            collapsed && "rotate-180"
          )} />
        </button>
      </div>

      {/* Navigation Menu */}
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
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile at Bottom */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={cn(
          "flex items-center space-x-3 p-3 rounded-lg bg-muted/50",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Gaurav</p>
              <p className="text-xs text-muted-foreground">Member</p>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}