import { Bell, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [logoutModalOpen, setLogoutModalOpen] = useState(false); // new state for logout modal

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Notification fetch failed");
    }
  };

  useEffect(() => {
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
        const res = await axios.put(`${import.meta.env.VITE_API_URL}/fees/notifications/mark-all-read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification: Notification) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/fees/notifications/${notification.id}`, { is_read: true }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));

      switch (notification.notification_type) {
        case "fee_assignment":
          navigate("/fees");
          break;
        case "diet_plan_assigned":
          navigate("/trainer/assign-diet");
          break;
        case "exercise_plan_assigned":
          navigate("/trainer/assign-exercise");
          break;
        case "diet_plan_assigned_to_user":
          navigate("/my-diet");
          break;
        case "exercise_plan_assigned_to_user":
          navigate("/my-exercise");
          break;
        case "revenue_approval_pending":
          navigate("/superadmin/approve-revenue");
          break;
        case "revenue_approval_complete":
          navigate("/manage-trainers");
          break;
        default:
          navigate("/dashboard");
          break;
      }
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to handle notification click:", err);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 bg-blue-50 border-b border-blue-100 transition-all duration-300 font-poppins"
      style={{
        paddingLeft: window.innerWidth >= 1024 ? (sidebarCollapsed ? "4rem" : "16rem") : "0",
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
          <h1 className="text-lg lg:text-xl font-semibold text-logoOrange !p-0 !m-0">
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
                      onClick={() => handleNotificationClick(n)}
                    >
                      {n.message}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-white/10"
            onClick={() => setLogoutModalOpen(true)}
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-red-600" />
          </Button>

          {/* Logout Confirm Modal */}
          <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to logout?</p>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setLogoutModalOpen(false)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setLogoutModalOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </header>
  );
}
