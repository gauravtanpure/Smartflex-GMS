import { Bell, Circle, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

export function Header({ sidebarCollapsed = false, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [initial, setInitial] = useState("U"); // Default initial

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username && username.length > 0) {
      setInitial(username[0].toUpperCase());
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("branch");
    localStorage.removeItem("profile_completion_percentage");
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 bg-primary border-b border-primary-hover/20 transition-all duration-300 lg:pl-64"
      style={{
        paddingLeft:
          window.innerWidth >= 1024 ? (sidebarCollapsed ? "4rem" : "16rem") : "0",
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-primary-foreground hover:bg-white/10"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <h1 className="text-lg lg:text-xl font-semibold text-primary-foreground">
            SmartFlex Fitness
          </h1>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          <div className="hidden sm:flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
            <Circle className="w-2 h-2 fill-red-500 text-red-500" />
            <span className="text-sm text-primary-foreground">Offline</span>
          </div>

          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10">
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          </Button>

          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">{initial}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-white/10"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
