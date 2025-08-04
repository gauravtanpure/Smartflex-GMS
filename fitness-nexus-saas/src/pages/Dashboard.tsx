import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
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

const cardBaseStyle = "bg-card text-foreground rounded-xl shadow-md";

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
          headers: { Authorization: `Bearer ${token}` },
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
    <div className="min-h-screen pt-4 px-6 sm:px-8 lg:px-12 bg-background font-poppins">
      <div className="max-w-7xl mx-auto space-y-6 text-[#6b7e86]">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Welcome back,</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-[#6b7e86]">{username}</h2>
        </div>

        {/* Daily Motivation */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              Daily Motivation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base italic">"{quoteOfTheDay}"</p>
          </CardContent>
        </Card>

        {/* Attendance Progress */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Attendance Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Week */}
              <div>
                <div className="flex justify-between text-sm">
                  <span>This Week</span>
                  <span>{attendedDaysThisWeek}/7 Days</span>
                </div>
                <Progress value={attendanceWeekPct} className="h-2" />
              </div>

              {/* Month */}
              <div>
                <div className="flex justify-between text-sm">
                  <span>This Month</span>
                  <span>{attendedDaysThisMonth}/{totalDaysInMonth} Days</span>
                </div>
                <Progress value={attendanceMonthPct} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className={cardBaseStyle}>
            <CardContent className="p-4 flex items-center space-x-4">
              <Calendar className="w-6 h-6" />
              <div>
                <p className="text-sm">Workouts This Week</p>
                <p className="text-lg font-semibold text-black">{attendedDaysThisWeek} Sessions</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBaseStyle}>
            <CardContent className="p-4 flex items-center space-x-4">
              <Flame className="w-6 h-6" />
              <div>
                <p className="text-sm">Calories Burned</p>
                <p className="text-lg font-semibold text-black">3,200 kcal</p>
              </div>
            </CardContent>
          </Card>

          <Card className={cardBaseStyle}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center space-x-4">
                <Target className="w-6 h-6" />
                <div>
                  <p className="text-sm">Goal Progress</p>
                  <p className="text-lg font-semibold text-black">70% Complete</p>
                </div>
              </div>
              <Progress value={70} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Achievement Section */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievement Unlocked!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">
              🥇 You've completed {attendedDaysThisWeek >= 7 ? "a 7-day" : `${attendedDaysThisWeek}-day`} streak! Keep it going!
            </p>
          </CardContent>
        </Card>

        {/* Pro Tip Section */}
        <Card className={cardBaseStyle}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Pro Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">
              Recovery is just as important as your workouts. Make sure to sleep 7–8 hours and hydrate properly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
