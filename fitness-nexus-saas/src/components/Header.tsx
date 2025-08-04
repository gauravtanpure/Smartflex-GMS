import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface HeaderProps {
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
}

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  notification_type?: string;
  created_at: string;
}

export function Header({ sidebarCollapsed = false, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:8000/fees/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Notification fetch failed");
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleBellClick = async () => {
    const token = localStorage.getItem("token");
    if (!showDropdown && unreadCount > 0) {
      try {
        const res = await axios.put("http://localhost:8000/fees/notifications/mark-all-read", {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 bg-blue-50 border-b border-blue-100 transition-all duration-300 font-poppins"

      style={{
        paddingLeft:
          window.innerWidth >= 1024 ? (sidebarCollapsed ? "4rem" : "16rem") : "0",
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm" 
            className="lg:hidden text-black hover:bg-black/10"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg lg:text-xl font-semibold" style={{ color: "#3f545eff" }}>
            SmartFlex Fitness
          </h1>

        </div>

        <div className="flex items-center space-x-2 lg:space-x-4 relative">
          <Button variant="ghost" size="sm" onClick={handleBellClick}>
            <div className="relative">
              <Bell className="w-5 h-5 #3f545eff" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </Button>

          {showDropdown && (
            <div className="absolute top-10 right-10 w-80 bg-white rounded shadow-lg z-50 p-4">
              <h4 className="font-semibold text-gray-800 mb-2" style={{ color: "#6b7e86" }}>
                Notifications
              </h4>
              <ul className="space-y-2 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="text-gray-500 text-sm">No notifications</li>
                ) : (
                  notifications.map(n => (
                    <li
                      key={n.id}
                      className="text-sm border-b pb-1 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={() => {
                        if (n.notification_type === "fee_assignment") {
                          navigate("/fees");
                        }
                      }}
                    >
                      {n.message}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-white/10"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-red-600" />
          </Button>
        </div>
      </div>
    </header>
  );
}
