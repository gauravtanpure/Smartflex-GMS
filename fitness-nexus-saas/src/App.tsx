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
import AssignDiet from "./pages/AssignDiet";
import AssignExercise from "./pages/AssignExercise";
import MyDiet from "./pages/MyDiet";
import MyExercise from "./pages/MyExercise";
import BranchUserList from "./pages/BranchUserList";
import ManageMembershipPlans from "./pages/ManageMembershipPlans";
import ApproveTrainerRevenue from "./pages/ApproveTrainerRevenue";
import PTORequest from "./pages/PTORequest";
import AdminAnalytics from "./pages/AdminAnalytics";
import ManagePTORequests from "./pages/ManagePTORequests";


const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  const [hasShownAuthError, setHasShownAuthError] = useState(false);

  const renderProtectedRoute = (Component: React.ElementType, allowedRoles: string[]) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      if (!hasShownAuthError && location.pathname !== '/login' && location.pathname !== '/register') {
        console.warn("Unauthorized access: No token found.");
        setHasShownAuthError(true);
      }
      return <Navigate to="/login" replace />;
    }

    if (role && allowedRoles.includes(role)) {
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
          <Route path="/my-exercise" element={renderProtectedRoute(MyExercise, ["member", "admin", "superadmin"])} />
          <Route path="/my-diet" element={renderProtectedRoute(MyDiet, ["member", "admin", "superadmin"])} />
          <Route path="/manage-trainers" element={renderProtectedRoute(ManageTrainers, ["admin", "superadmin"])} />
          <Route path="/manage-branches" element={renderProtectedRoute(ManageBranches, ["superadmin"])} />
          <Route path="/trainer/users" element={renderProtectedRoute(TrainerUsers, ["trainer", "admin", "superadmin"])} />
          <Route path="/trainer/attendance" element={renderProtectedRoute(TrainerAttendance, ["trainer", "admin", "superadmin"])} />
          <Route path="/trainer/sessions" element={renderProtectedRoute(ManageSessions, ["trainer", "admin", "superadmin"])} />
          <Route path="/manage-fees" element={renderProtectedRoute(ManageFees, ["admin", "superadmin"])} />
          <Route path="/trainer/assign-diet" element={renderProtectedRoute(AssignDiet, ["trainer", "admin", "superadmin"])} />
          <Route path="/trainer/assign-exercise" element={renderProtectedRoute(AssignExercise, ["trainer", "admin", "superadmin"])} />
          <Route path="/manage-membership-plans" element={renderProtectedRoute(ManageMembershipPlans, ["admin", "superadmin"])} />
          <Route path="/branch-users" element={renderProtectedRoute(BranchUserList, ["admin"])} />
          <Route path="/approve-trainer-revenue" element={renderProtectedRoute(ApproveTrainerRevenue, ["superadmin"])} />
          <Route path="/admin-analytics" element={renderProtectedRoute(AdminAnalytics, ["admin", "superadmin"])} />
          {/* New PTO Routes */}
          <Route path="/trainer/pto-request" element={renderProtectedRoute(PTORequest, ["trainer"])} />
          <Route path="/admin/manage-pto" element={renderProtectedRoute(ManagePTORequests, ["admin"])} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;