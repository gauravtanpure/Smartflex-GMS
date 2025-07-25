import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import { useToast } from "@/components/ui/use-toast";

const queryClient = new QueryClient();

const App = () => {
  // We'll keep these states, but renderProtectedRoute will use localStorage directly
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // This will primarily be for other App-wide logic
  const [isLoading, setIsLoading] = useState(true); // Keep this for initial load
  const { toast } = useToast();
  const location = useLocation();

  // States to prevent multiple toasts for the same unauthorized attempt
  const [hasShownAuthToast, setHasShownAuthToast] = useState(false);
  const [hasShownPermissionToast, setHasShownPermissionToast] = useState(false);

  useEffect(() => {
    // This useEffect will now primarily synchronize internal state with localStorage for other components/logic
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    setIsAuthenticated(!!token);
    setUserRole(role);
    setIsLoading(false); // Set false once initial localStorage check is done

    // Reset toast flags on route change to allow new toasts if applicable
    setHasShownAuthToast(false);
    setHasShownPermissionToast(false);
  }, [location.pathname]); // This still triggers on route changes, useful for resetting toast flags

  // Helper function to render protected routes
  const renderProtectedRoute = (Component: React.ElementType, allowedRoles: string[]) => {
    // Read directly from localStorage for the most up-to-date authentication status
    const currentToken = localStorage.getItem("token");
    const currentRole = localStorage.getItem("role");

    // No need for isLoading check here as we're relying on currentToken
    // If you have a global loading spinner for ALL initial app load, keep isLoading
    // For protected routes, direct token check is more immediate.
    // if (isLoading) {
    //   return <div>Loading...</div>; // Or a spinner
    // }

    if (!currentToken) { // If NO token is found, redirect to login
      if (!hasShownAuthToast) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page.",
          variant: "destructive",
        });
        setHasShownAuthToast(true); // Mark toast as shown
      }
      return <Navigate to="/login" replace />;
    }

    // If a token exists, check role-based access
    // if (currentRole && !allowedRoles.includes(currentRole)) {
    //   if (!hasShownPermissionToast) {
    //     toast({
    //       title: "Access Denied",
    //       description: "You do not have permission to view this page.",
    //       variant: "destructive",
    //     });
    //     setHasShownPermissionToast(true); // Mark toast as shown
    //   }
    //   return <Navigate to="/dashboard" replace />; // Redirect to dashboard or forbidden page
    // }

    // If authenticated and authorized, render the component
    return <Layout><Component /></Layout>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Use renderProtectedRoute for all */}
          <Route path="/dashboard" element={renderProtectedRoute(Dashboard, ["member", "admin", "superadmin"])} />
          <Route path="/trainers" element={renderProtectedRoute(Trainers, ["member", "admin", "superadmin"])} />
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

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;