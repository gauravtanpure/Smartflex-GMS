import { FeeSummaryCard } from "@/components/FeeSummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock, Target } from "lucide-react";
import { useEffect, useState } from "react";

// For demonstration, these can be part of your Tailwind config or global CSS
const cardBaseStyle = "bg-white/70 backdrop-blur-md rounded-xl shadow-lg";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [paidFees, setPaidFees] = useState(0);
  const [unpaidFees, setUnpaidFees] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]); // To store attendance data
  const [totalDaysInMonth, setTotalDaysInMonth] = useState(30); // Placeholder, calculate dynamically if needed
  const [attendedDaysThisMonth, setAttendedDaysThisMonth] = useState(0);
  const [attendedDaysThisWeek, setAttendedDaysThisWeek] = useState(0);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token"); // Assuming you store the auth token
      if (!token) {
        // Handle unauthenticated user, e.g., redirect to login
        console.error("No authentication token found.");
        return;
      }

      // Fetch Fee Data
      try {
        const feeResponse = await fetch("http://127.0.0.1:8000/fees/my-fees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (feeResponse.ok) {
          const fees = await feeResponse.json();
          let paid = 0;
          let unpaid = 0;
          fees.forEach((fee: any) => {
            if (fee.is_paid) {
              paid += fee.amount;
            } else {
              unpaid += fee.amount;
            }
          });
          setPaidFees(paid);
          setUnpaidFees(unpaid);
        } else {
          console.error("Failed to fetch fees:", feeResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching fees:", error);
      }

      // Fetch Attendance Data
      try {
        const attendanceResponse = await fetch("http://127.0.0.1:8000/users/my-attendance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (attendanceResponse.ok) {
          const attendance = await attendanceResponse.json();
          setAttendanceRecords(attendance);

          // Calculate attendance for "This Month" and "This Week"
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();

          // Calculate days in current month
          const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          setTotalDaysInMonth(lastDayOfMonth);

          let monthAttended = 0;
          let weekAttended = 0;

          // Get the start of the current week (e.g., Sunday)
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Adjust to Sunday

          attendance.forEach((record: any) => {
            const recordDate = new Date(record.date);
            if (record.status === "present") {
              // For "This Month"
              if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                monthAttended++;
              }
              // For "This Week"
              if (recordDate >= startOfWeek && recordDate <= today) {
                weekAttended++;
              }
            }
          });
          setAttendedDaysThisMonth(monthAttended);
          setAttendedDaysThisWeek(weekAttended);

        } else {
          console.error("Failed to fetch attendance:", attendanceResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const attendanceThisWeekPercentage = (attendedDaysThisWeek / 7) * 100;
  const attendanceThisMonthPercentage = (attendedDaysThisMonth / totalDaysInMonth) * 100;

  return (
    <div
      className="min-h-screen p-6 sm:p-8 lg:p-12"
      style={{
        background:
          "linear-gradient(135deg, #E0F2F7, #E8DFF2, #F7E0F7, #F0F7E0)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1
            className="text-2xl md:text-3xl font-bold text-gray-800"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Hi, Welcome back
          </h1>
          <h2
            className="text-3xl md:text-4xl font-bold text-blue-600"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {username}
          </h2>
        </div>

        {/* Fee Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <FeeSummaryCard
            title="Paid"
            amount={paidFees}
            type="paid"
            cardClassName={cardBaseStyle}
            titleClassName="font-semibold text-gray-700"
            amountClassName="text-3xl font-bold text-green-600"
          />
          <FeeSummaryCard
            title="Unpaid"
            amount={unpaidFees}
            type="unpaid"
            cardClassName={cardBaseStyle}
            titleClassName="font-semibold text-gray-700"
            amountClassName="text-3xl font-bold text-red-500"
          />
        </div>

        {/* Attendance Section */}
        <div className="space-y-4">
          <h3
            className="text-xl md:text-2xl font-semibold text-gray-800"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Attendance
          </h3>

          <Card className={cardBaseStyle}>
            <CardHeader>
              <CardTitle
                className="flex items-center space-x-2 text-gray-700"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span>Attendance Graph</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>This Week</span>
                    <span className="text-muted-foreground">
                      {attendedDaysThisWeek}/7 days
                    </span>
                  </div>
                  <Progress
                    value={attendanceThisWeekPercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-emerald-400 to-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>This Month</span>
                    <span className="text-muted-foreground">
                      {attendedDaysThisMonth}/{totalDaysInMonth} days
                    </span>
                  </div>
                  <Progress
                    value={attendanceThisMonthPercentage}
                    className="h-2"
                    indicatorClassName="bg-gradient-to-r from-amber-300 to-rose-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-4 border-t border-gray-200/50">
                  <div className="text-center">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 shadow-md"
                      style={{
                        background: "linear-gradient(45deg, #A78BFA, #8B5CF6)",
                      }}
                    >
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground">Total Days</p>
                    <p
                      className="font-semibold text-gray-800"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {totalDaysInMonth}
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 shadow-md"
                      style={{
                        background: "linear-gradient(45deg, #6EE7B7, #22C55E)",
                      }}
                    >
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground">Present</p>
                    <p
                      className="font-semibold text-green-600"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {attendedDaysThisMonth}
                    </p>
                  </div>
                  <div className="text-center">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 shadow-md"
                      style={{
                        background: "linear-gradient(45deg, #FDBF6F, #FC9E00)",
                      }}
                    >
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p
                      className="font-semibold text-gray-800"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      25 {/* This remains static as it's a target, not fetched */}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats (These can remain static or be fetched if corresponding backend data exists) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className={cardBaseStyle}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(45deg, #6EE7B7, #3B82F6)",
                  }}
                >
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Workout Goal</p>
                  <p
                    className="text-lg font-semibold text-gray-800"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    75% Complete {/* Static for now */}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBaseStyle}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(45deg, #FDE68A, #FB7185)",
                  }}
                >
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p
                    className="text-lg font-semibold text-gray-800"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    4 Sessions {/* Static for now */}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBaseStyle}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(45deg, #A78BFA, #8B5CF6)",
                  }}
                >
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p
                    className="text-lg font-semibold text-gray-800"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    24.5 hrs {/* Static for now */}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}