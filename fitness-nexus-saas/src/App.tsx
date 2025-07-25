import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster"; // Keep Toaster for other components if they use it
import { Toaster as Sonner } from "@/components/ui/sonner"; // Keep Sonner for other components if they use it
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Trainers from "./pages/Trainers";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Exercise from "./pages/Exercise";
import Diet from "./pages/Diet";
import NotFound from "./pages/NotFound";
import ManageBranches from "./pages/ManageBranches";
import ManageTrainers from "./pages/ManageTrainers";
import TrainerUsers from "./pages/TrainerUsers";
import TrainerAttendance from "./pages/TrainerAttendance";
// import { useToast } from "@/components/ui/use-toast"; // Removed useToast import
import ProfileCompletion from "./pages/ProfileCompletion"; // Import the new ProfileCompletion page

const queryClient = new QueryClient();

const App = () => {
  // const { toast } = useToast(); // Removed toast initialization
  const location = useLocation();

  // States to prevent multiple console messages for the same unauthorized attempt
  const [hasShownAuthMessage, setHasShownAuthMessage] = useState(false);
  const [hasShownPermissionMessage, setHasShownPermissionMessage] = useState(false);

  useEffect(() => {
    // Reset message flags on route change to allow new messages if applicable
    setHasShownAuthMessage(false);
    setHasShownPermissionMessage(false);
  }, [location.pathname]);

  // Helper function to render protected routes
  const renderProtectedRoute = (Component: React.ElementType, allowedRoles: string[]) => {
    const currentToken = localStorage.getItem("token");
    const currentRole = localStorage.getItem("role");

    if (!currentToken) {
      if (!hasShownAuthMessage) {
        console.warn("Authentication Required: Please log in to access this page."); // Replaced toast with console.warn
        setHasShownAuthMessage(true);
      }
      return <Navigate to="/login" replace />;
    }

    if (currentRole && !allowedRoles.includes(currentRole)) {
      if (!hasShownPermissionMessage) {
        console.warn("Access Denied: You do not have permission to view this page."); // Replaced toast with console.warn
        setHasShownPermissionMessage(true);
      }
      return <Navigate to="/dashboard" replace />;
    }

    return <Layout><Component /></Layout>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster /> {/* Keep Toaster */}
        <Sonner /> {/* Keep Sonner */}
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* New Profile Completion Route */}
          <Route path="/profile-completion" element={renderProtectedRoute(ProfileCompletion, ["member", "admin", "superadmin", "trainer"])} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={renderProtectedRoute(Dashboard, ["member", "admin", "superadmin", "trainer"])} />
          <Route path="/trainers" element={renderProtectedRoute(Trainers, ["member", "admin", "superadmin", "trainer"])} />
          <Route path="/attendance" element={renderProtectedRoute(Attendance, ["member", "admin", "superadmin"])} />
          <Route path="/fees" element={renderProtectedRoute(Fees, ["member", "admin", "superadmin"])} />
          <Route path="/exercise" element={renderProtectedRoute(Exercise, ["member", "admin", "superadmin"])} />
          <Route path="/diet" element={renderProtectedRoute(Diet, ["member", "admin", "superadmin"])} />

          {/* Protected Route for Manage Trainers (Accessible by 'admin' and 'superadmin') */}
          <Route
            path="/manage-trainers"
            element={renderProtectedRoute(ManageTrainers, ["admin", "superadmin"])}
          />

          {/* Protected Route for Manage Branches (Accessible only by 'superadmin') */}
          <Route
            path="/manage-branches"
            element={renderProtectedRoute(ManageBranches, ["superadmin"])}
          />

          {/* New Protected Routes for Trainers */}
          <Route
            path="/trainer/users"
            element={renderProtectedRoute(TrainerUsers, ["trainer", "admin", "superadmin"])}
          />
          <Route
            path="/trainer/attendance"
            element={renderProtectedRoute(TrainerAttendance, ["trainer", "admin", "superadmin"])}
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
