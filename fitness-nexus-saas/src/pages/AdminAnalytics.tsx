// import { useEffect, useState } from "react";
// import { Pie, Bar } from "react-chartjs-2";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// export default function AdminAnalytics() {
//   const [data, setData] = useState<any>(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     fetch("http://127.0.0.1:8000/analytics/branch-data", {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//       .then(res => res.json())
//       .then(setData)
//       .catch(err => console.error(err));
//   }, []);

//   if (!data) return <p>Loading analytics...</p>;

//   const genderData = {
//     labels: Object.keys(data.users.by_gender),
//     datasets: [{ data: Object.values(data.users.by_gender), backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"] }]
//   };

//   const specializationData = {
//     labels: Object.keys(data.trainers.by_specialization),
//     datasets: [{ data: Object.values(data.trainers.by_specialization), backgroundColor: ["#4BC0C0", "#9966FF", "#FF9F40"] }]
//   };

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-2xl font-bold">Branch Analytics</h1>

//       <Card>
//         <CardHeader><CardTitle>Users by Gender</CardTitle></CardHeader>
//         <CardContent><Pie data={genderData} /></CardContent>
//       </Card>

//       <Card>
//         <CardHeader><CardTitle>Trainers by Specialization</CardTitle></CardHeader>
//         <CardContent><Bar data={specializationData} /></CardContent>
//       </Card>
//     </div>
//   );
// }


// src/pages/AdminAnalytics.tsx
import { useEffect, useState } from "react";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// This is a mock API call. In a real application, you would create a backend endpoint to provide this data.
const mockFetchAnalyticsData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        users: {
          by_gender: {
            Male: 45,
            Female: 55,
            Other: 2,
          },
          plan_status: {
            Active: 80,
            Unpaid: 15,
            Pending: 5,
          },
          enrollment_trend: [
            { month: "Jan", count: 10 },
            { month: "Feb", count: 15 },
            { month: "Mar", count: 20 },
            { month: "Apr", count: 25 },
            { month: "May", count: 18 },
            { month: "Jun", count: 22 },
          ]
        },
        trainers: {
          by_specialization: {
            "Weight Training": 5,
            "Cardio": 3,
            "Yoga": 2,
            "Pilates": 1,
          },
          revenue_status: [
            { id: 1, name: "Rohan Suryawanshi", is_approved_by_superadmin: true },
            { id: 2, name: "Shantanu Shinde", is_approved_by_superadmin: false },
            { id: 3, name: "Prasanna Mendhe", is_approved_by_superadmin: true },
            { id: 4, name: "Nikhil Pattewar", is_approved_by_superadmin: false },
          ],
          pending_pto: [
            { id: 101, trainer_name: "Rohan Suryawanshi", start_date: "2025-09-01", end_date: "2025-09-05" },
            { id: 102, trainer_name: "Nikhil Pattewar", start_date: "2025-10-15", end_date: "2025-10-18" },
          ],
        },
      });
    }, 1000);
  });
};

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (role !== "admin" && role !== "superadmin") {
      // In a real application, you'd redirect or show an error
      return;
    }

    // Replace this mock call with a real fetch to your FastAPI endpoint
    // Example: fetch("http://127.0.0.1:8000/analytics/branch-data", ...)
    mockFetchAnalyticsData().then(setAnalyticsData);
  }, []);

  if (!analyticsData) {
    return <p className="text-center p-8">Loading analytics...</p>;
  }

  // User Analytics Data
  const usersByGenderData = {
    labels: Object.keys(analyticsData.users.by_gender),
    datasets: [{
      data: Object.values(analyticsData.users.by_gender),
      backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"],
    }],
  };
  
  const userEnrollmentData = {
    labels: analyticsData.users.enrollment_trend.map((d: any) => d.month),
    datasets: [{
      label: 'New Users',
      data: analyticsData.users.enrollment_trend.map((d: any) => d.count),
      backgroundColor: '#9966FF',
    }],
  };
  
  const membershipPlanStatusData = {
    labels: Object.keys(analyticsData.users.plan_status),
    datasets: [{
      data: Object.values(analyticsData.users.plan_status),
      backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
    }],
  };

  // Trainer Analytics Data
  const trainersBySpecializationData = {
    labels: Object.keys(analyticsData.trainers.by_specialization),
    datasets: [{
      label: 'Number of Trainers',
      data: Object.values(analyticsData.trainers.by_specialization),
      backgroundColor: "#4BC0C0",
    }],
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 text-logoOrange">Analytics Dashboard</h1>
      <p className="text-gray-600">Overview of user and trainer data for your branch.</p>
      
      {/* User Analytics Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">User Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Users by Gender</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Pie data={usersByGenderData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>User Enrollment Over Time</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar data={userEnrollmentData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Membership Plan Status</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <Doughnut data={membershipPlanStatusData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>
      </div>
      
      {/* Trainer Analytics Section */}
      <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-700">Trainer Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Trainers by Specialization</CardTitle></CardHeader>
          <CardContent className="h-64">
            <Bar data={trainersBySpecializationData} options={{ maintainAspectRatio: false }} />
          </CardContent>
        </Card>

        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Trainer Revenue Approval</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {analyticsData.trainers.revenue_status.map((trainer: any) => (
                <li key={trainer.id} className="flex items-center space-x-3">
                  <span className="flex-1 font-medium">{trainer.name}</span>
                  <Progress value={trainer.is_approved_by_superadmin ? 100 : 50} className="w-1/2" />
                  <span className={`text-sm font-medium ${trainer.is_approved_by_superadmin ? 'text-green-600' : 'text-yellow-600'}`}>
                    {trainer.is_approved_by_superadmin ? "Approved" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader><CardTitle>Pending PTO Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.trainers.pending_pto.map((pto: any) => (
                  <TableRow key={pto.id}>
                    <TableCell className="font-medium">{pto.trainer_name}</TableCell>
                    <TableCell>{pto.start_date}</TableCell>
                    <TableCell>{pto.end_date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}