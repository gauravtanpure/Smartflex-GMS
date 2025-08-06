// App.tsx
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
import NotFound from "./pages/NotFound";
import ManageBranches from "./pages/ManageBranches";
import ManageTrainers from "./pages/ManageTrainers";
import TrainerUsers from "./pages/TrainerUsers";
import TrainerAttendance from "./pages/TrainerAttendance";
import ProfileCompletion from "./pages/ProfileCompletion";
import ManageFees from "./pages/ManageFees";
import ManageSessions from "./pages/ManageSessions";
// New imports for trainer assignment pages
import AssignDiet from "./pages/AssignDiet";
import AssignExercise from "./pages/AssignExercise";
// New imports for member viewing pages
import MyDiet from "./pages/MyDiet";
import MyExercise from "./pages/MyExercise";
import BranchUserList from "./pages/BranchUserList";
import ManageMembershipPlans from "./pages/ManageMembershipPlans"; // ⬅️ NEW IMPORT

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();

  const [hasShownAuthError, setHasShownAuthError] = useState(false);

  // Helper function for protected routes
  const renderProtectedRoute = (Component: React.ElementType, allowedRoles: string[]) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      if (!hasShownAuthError && location.pathname !== '/login' && location.pathname !== '/register') {
        console.warn("Unauthorized access: No token found.");
        setHasShownAuthError(true);
      }
      return <Navigate to="/login" replace />; //
    }

    if (role && allowedRoles.includes(role)) {
      // REMOVED: setHasShownAuthError(false);
      // This line was causing an infinite re-render loop because it would
      // trigger a re-render on every successful authorization check.
      return (
        <Layout>
          <Component />
        </Layout>
      );
    } else {
      if (!hasShownAuthError) {
        console.warn(`Unauthorized access: Role '${role}' not allowed for this route. Required roles: ${allowedRoles.join(', ')}`);
        setHasShownAuthError(true);
      }
      // Redirect to dashboard or a specific unauthorized page
      return <Navigate to="/dashboard" replace />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <TooltipProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={renderProtectedRoute(Dashboard, ["member", "trainer", "admin", "superadmin"])} />
          <Route path="/trainers" element={renderProtectedRoute(Trainers, ["member", "trainer", "admin", "superadmin"])} />
          <Route path="/attendance" element={renderProtectedRoute(Attendance, ["member", "admin", "superadmin"])} />
          <Route path="/fees" element={renderProtectedRoute(Fees, ["member", "admin", "superadmin"])} />
          <Route path="/profile-completion" element={renderProtectedRoute(ProfileCompletion, ["member", "trainer", "admin", "superadmin"])} />

          {/* Member Specific Tabs - Renamed from original Exercise/Diet */}
          <Route path="/my-exercise" element={renderProtectedRoute(MyExercise, ["member", "admin", "superadmin"])} /> {/* */}
          <Route path="/my-diet" element={renderProtectedRoute(MyDiet, ["member", "admin", "superadmin"])} /> {/* */}


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

          {/* Protected Routes for Trainers */}
          <Route
            path="/trainer/users"
            element={renderProtectedRoute(TrainerUsers, ["trainer", "admin", "superadmin"])}
          />
          <Route
            path="/trainer/attendance"
            element={renderProtectedRoute(TrainerAttendance, ["trainer", "admin", "superadmin"])}
          />
          <Route
            path="/trainer/sessions"
            element={renderProtectedRoute(ManageSessions, ["trainer", "admin", "superadmin"])}
          />
          <Route path="/manage-fees" element={renderProtectedRoute(ManageFees, ["admin", "superadmin"])} />

          {/* NEW Protected Routes for Trainer: Assign Diet and Exercise */}
          <Route
            path="/trainer/assign-diet"
            element={renderProtectedRoute(AssignDiet, ["trainer", "admin", "superadmin"])}
          /> {/* */}
          <Route
            path="/trainer/assign-exercise"
            element={renderProtectedRoute(AssignExercise, ["trainer", "admin", "superadmin"])}
          /> {/* */}

          {/* NEW Protected Route for Manage Membership Plans (Admin and Superadmin) */}
          <Route
            path="/manage-membership-plans"
            element={renderProtectedRoute(ManageMembershipPlans, ["admin", "superadmin"])}
          />

          <Route
            path="/branch-users"
            element={renderProtectedRoute(BranchUserList, ["admin"])}
          />
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;