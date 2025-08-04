import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Flame,
  Target,
  HeartPulse,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

// Quotes to rotate daily
const quotes = [
  "Discipline is choosing between what you want now and what you want most.",
  "Push yourself because no one else is going to do it for you.",
  "The body achieves what the mind believes.",
  "No pain, no gain. Shut up and train.",
  "Sweat is fat crying.",
  "It never gets easier, you just get stronger.",
];

const cardBaseStyle = "bg-white/70 backdrop-blur-md rounded-xl shadow-lg";

export default function Dashboard() {
  const [username, setUsername] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [totalDaysInMonth, setTotalDaysInMonth] = useState(30);
  const [attendedDaysThisMonth, setAttendedDaysThisMonth] = useState(0);
  const [attendedDaysThisWeek, setAttendedDaysThisWeek] = useState(0);

  const quoteOfTheDay = quotes[new Date().getDate() % quotes.length];

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return console.error("No token found.");

      try {
        const res = await fetch("http://127.0.0.1:8000/users/my-attendance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const attendance = await res.json();
          setAttendanceRecords(attendance);

          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();

          const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          setTotalDaysInMonth(lastDayOfMonth);

          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());

          let monthAttended = 0;
          let weekAttended = 0;

          attendance.forEach((record: any) => {
            const recordDate = new Date(record.date);
            if (record.status === "present") {
              if (recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear) {
                monthAttended++;
              }
              if (recordDate >= startOfWeek && recordDate <= today) {
                weekAttended++;
              }
            }
          });

          setAttendedDaysThisMonth(monthAttended);
          setAttendedDaysThisWeek(weekAttended);
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    };

    fetchData();
  }, []);

  const attendanceWeekPct = (attendedDaysThisWeek / 7) * 100;
  const attendanceMonthPct = (attendedDaysThisMonth / totalDaysInMonth) * 100;

  return (
    <div
      className="min-h-screen p-6 sm:p-8 lg:p-12"
      style={{
        background: "linear-gradient(135deg, #E0F2F7, #E8DFF2, #F7E0F7, #F0F7E0)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Welcome back,</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-600">{username}</h2>
        </div>

        {/* 🧠 Daily Motivation */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              Daily Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg italic text-gray-700">"{quoteOfTheDay}"</p>
          </CardContent>
        </Card>

        {/* Attendance Progress */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Attendance Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Week */}
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>This Week</span>
                  <span>{attendedDaysThisWeek}/7 Days</span>
                </div>
                <Progress
                  value={attendanceWeekPct}
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-green-400 to-blue-500"
                />
              </div>

              {/* Month */}
              <div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>This Month</span>
                  <span>
                    {attendedDaysThisMonth}/{totalDaysInMonth} Days
                  </span>
                </div>
                <Progress
                  value={attendanceMonthPct}
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-yellow-400 to-pink-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sessions */}
          <Card className={cardBaseStyle}>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-green-300 to-blue-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workouts This Week</p>
                <p className="text-lg font-semibold text-gray-800">
                  {attendedDaysThisWeek} Sessions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Calories (mocked) */}
          <Card className={cardBaseStyle}>
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-yellow-300 to-pink-500">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
                <p className="text-lg font-semibold text-orange-600">3,200 kcal</p>
              </div>
            </CardContent>
          </Card>

          {/* Goal Progress */}
          <Card className={cardBaseStyle}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-indigo-400 to-purple-600">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal Progress</p>
                  <p className="text-lg font-semibold text-gray-800">70% Complete</p>
                </div>
              </div>
              <Progress value={70} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* ✅ Achievement Section */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-yellow-700 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievement Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 text-lg">
              🥇 You've completed {attendedDaysThisWeek >= 7 ? "a 7-day" : `${attendedDaysThisWeek}-day`} streak!
              Keep it going!
            </p>
          </CardContent>
        </Card>

        {/* ✅ Pro Tip Section */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-green-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pro Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-md">
              Recovery is just as important as your workouts. Make sure to sleep 7–8 hours and hydrate properly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
