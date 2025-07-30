import { Bell, Circle, Menu, LogOut } from "lucide-react";
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
  const [initial, setInitial] = useState("U");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) setInitial(username[0].toUpperCase());

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
    if (!showDropdown && unreadCount > 0) { // Only mark as read if dropdown is about to open and there are unread notifications
      try {
        const res = await axios.put("http://localhost:8000/fees/notifications/mark-all-read", {}, { //
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data); // Update notifications state with newly marked-read notifications
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
    setShowDropdown(!showDropdown); // Toggle dropdown visibility
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
          <h1 className="text-lg lg:text-xl font-semibold text-primary-foreground">SmartFlex Fitness</h1>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4 relative">
          <Button variant="ghost" size="sm" onClick={handleBellClick}> {/* Use the new handler */}
            <div className="relative">
              <Bell className="w-5 h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center text-xs text-white">
                  {unreadCount}
                </span> // Added unreadCount display for clarity
              )}
            </div>
          </Button>

          {showDropdown && (
            <div className="absolute top-10 right-10 w-80 bg-white rounded shadow-lg z-50 p-4">
              <h4 className="font-bold mb-2">Notifications</h4>
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
                        // Optionally mark individual notification as read on click
                        // This requires another PUT endpoint for single notification
                      }}
                    >
                      {n.message}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">{initial}</span>
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