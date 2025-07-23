import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const attendanceData = [
  { date: "2024-01-22", status: "present", time: "06:30 AM - 08:00 AM" },
  { date: "2024-01-21", status: "present", time: "06:30 AM - 08:00 AM" },
  { date: "2024-01-20", status: "absent", time: "-" },
  { date: "2024-01-19", status: "present", time: "06:30 AM - 08:00 AM" },
  { date: "2024-01-18", status: "present", time: "06:30 AM - 08:00 AM" },
  { date: "2024-01-17", status: "absent", time: "-" },
  { date: "2024-01-16", status: "present", time: "06:30 AM - 08:00 AM" },
];

export default function Attendance() {
  const presentDays = attendanceData.filter(day => day.status === "present").length;
  const totalDays = attendanceData.length;
  const attendancePercentage = Math.round((presentDays / totalDays) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground mt-1">Track your gym attendance and workout consistency</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>{attendancePercentage}% This Week</span>
        </Badge>
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Days Present</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{presentDays}</div>
            <p className="text-sm text-muted-foreground">out of {totalDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <span>Days Absent</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{totalDays - presentDays}</div>
            <p className="text-sm text-muted-foreground">missed sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Attendance Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{attendancePercentage}%</div>
            <Progress value={attendancePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Recent Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceData.map((day) => (
              <div key={day.date} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    day.status === "present" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {day.status === "present" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{day.status}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {day.time !== "-" && (
                    <>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{day.time}</span>
                    </>
                  )}
                  <Badge variant={day.status === "present" ? "default" : "destructive"}>
                    {day.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Workout Days (Goal: 5 days)</span>
                <span>{presentDays}/5 days</span>
              </div>
              <Progress value={(presentDays / 5) * 100} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Consistency Rate (Goal: 80%)</span>
                <span>{attendancePercentage}%</span>
              </div>
              <Progress value={attendancePercentage} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}