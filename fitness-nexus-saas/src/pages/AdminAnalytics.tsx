// src/pages/AdminAnalytics.tsx
import { useEffect, useState, useMemo } from "react";
import { Pie, Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge"; 
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [userPlanStatus, setUserPlanStatus] = useState<any[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (role !== "admin" && role !== "superadmin") {
      return;
    }

    // Fetch main analytics data
    fetch("http://127.0.0.1:8000/analytics/branch-data", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then(setAnalyticsData)
      .catch(err => {
        console.error("Failed to fetch analytics data:", err);
        setAnalyticsData(null); 
      });

    // Fetch user plan status data
    fetch("http://127.0.0.1:8000/analytics/user-plan-status", {
        headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then(setUserPlanStatus)
      .catch(err => {
        console.error("Failed to fetch user plan status:", err);
        setUserPlanStatus(null);
      });

  }, []);

  // Filter users based on search term and selected status
  const filteredUsers = useMemo(() => {
    if (!userPlanStatus) return [];
    
    return userPlanStatus.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || (filterStatus === "active" && user.has_plan) || (filterStatus === "inactive" && !user.has_plan);
      return matchesSearch && matchesFilter;
    });
  }, [userPlanStatus, searchTerm, filterStatus]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!analyticsData || !userPlanStatus) {
    return <p className="text-center p-8">Loading analytics...</p>;
  }

  const usersWithPlanCount = userPlanStatus.filter(u => u.has_plan).length;
  const usersWithoutPlanCount = userPlanStatus.length - usersWithPlanCount;

  // --- User Analytics Data ---
  const usersByGenderData = {
    labels: Object.keys(analyticsData.users.by_gender),
    datasets: [{
      data: Object.values(analyticsData.users.by_gender),
      backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
    }],
  };
  
  const usersByRoleData = {
    labels: Object.keys(analyticsData.users.by_role),
    datasets: [{
      data: Object.values(analyticsData.users.by_role),
      backgroundColor: ["#FFC107", "#4BC0C0", "#9966FF"],
    }],
  };
  
  // --- Membership Plan Analytics Data ---
  const plansByStatusData = {
    labels: Object.keys(analyticsData.plans.by_status),
    datasets: [{
      data: Object.values(analyticsData.plans.by_status),
      backgroundColor: ["#4CAF50", "#F44336"],
    }],
  };

  // --- Trainer & Class Analytics Data ---
  const trainersBySpecializationData = {
    labels: Object.keys(analyticsData.trainers.by_specialization),
    datasets: [{
      label: 'Number of Trainers',
      data: Object.values(analyticsData.trainers.by_specialization),
      backgroundColor: "#4BC0C0",
    }],
  };
  
  const trainersByBranchData = {
    labels: Object.keys(analyticsData.trainers.by_branch),
    datasets: [{
      label: 'Trainers',
      data: Object.values(analyticsData.trainers.by_branch),
      backgroundColor: "#66CC99",
    }],
  };
  
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-boldd text-gray-800 text-logoOrange">Analytics Dashboard</h1>
      <p className="text-gray-600">Overview of user, trainer, and plan data for your branch.</p>
      
      {/* User Analytics Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">User Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Users by Gender</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Pie data={usersByGenderData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Users by Role</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Doughnut data={usersByRoleData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>
      </div>

      <hr className="my-6 border-gray-300" />
      
      {/* Trainer & Class Analytics Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Trainer & Class Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Trainers by Specialization</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar data={trainersBySpecializationData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Trainers by Branch</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar data={trainersByBranchData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Top Rated Trainers</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analyticsData.trainers.top_rated.map((trainer: any, index: number) => (
                <li key={index} className="flex justify-between items-center p-2 border rounded-md shadow-sm">
                  <span className="font-medium text-gray-700">{trainer.name}</span>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-semibold">{trainer.rating}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* Membership Plan Analytics Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Membership Plan Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Membership Plans by Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Doughnut data={plansByStatusData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>
      </div>

      <hr className="my-6 border-gray-300" />

      {/* User Membership Status Table */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">User Membership Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-lg">Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-gray-800">{userPlanStatus.length}</p></CardContent>
        </Card>
        <Card className="shadow-lg bg-green-500 text-white">
          <CardHeader><CardTitle className="text-lg">Users with a Plan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{usersWithPlanCount}</p></CardContent>
        </Card>
        <Card className="shadow-lg bg-red-500 text-white">
          <CardHeader><CardTitle className="text-lg">Users without a Plan</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{usersWithoutPlanCount}</p></CardContent>
        </Card>
      </div>
      
      <div className="flex items-center space-x-4 mb-4">
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3"
        />
        <Select onValueChange={(value) => setFilterStatus(value)} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active Plan</SelectItem>
            <SelectItem value="inactive">Inactive Plan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.user_id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge className={`${user.has_plan ? "bg-green-500" : "bg-red-500"}`}>
                      {user.has_plan ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}