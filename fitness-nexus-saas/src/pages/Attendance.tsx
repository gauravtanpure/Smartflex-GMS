import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast"; // Import useToast

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD format
  status: string;
  branch: string;
}

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMyAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const res = await fetch("http://localhost:8000/users/my-attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data: AttendanceRecord[] = await res.json();
        // Sort data by date descending to show most recent first, if not already sorted by backend
        const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendanceData(sortedData);
      } else {
        let errorMsg = "Failed to fetch attendance records.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          errorMsg = res.statusText || "Unknown error occurred while parsing attendance response.";
        }
        setError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const presentDays = attendanceData.filter(day => day.status === "present").length;
  const totalDays = attendanceData.length;
  // Prevent division by zero if totalDays is 0
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Attendance</h1>
          <p className="text-muted-foreground mt-1">Track your gym attendance and workout consistency</p>
        </div>
        <Badge variant="outline" className="flex items-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          {/* This might need more complex logic for "This Week" based on fetched dates */}
          <span>{attendancePercentage}% Overall</span>
        </Badge>
      </div>

      {/* Attendance Overview */}
      {loading ? (
        <p>Loading attendance data...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
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
      )}

      {/* Recent Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Recent Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading recent attendance...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : attendanceData.length === 0 ? (
            <p>No attendance records found.</p>
          ) : (
            <div className="space-y-4">
              {attendanceData.map((day) => (
                <div key={day.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
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
                    {/* Assuming time is not directly stored in attendance record,
                        you might need to fetch it from another source or derive it.
                        For now, keeping it static or removing if not applicable.
                        If your backend attendance record includes time, update the interface.
                    */}
                    {/* <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{day.time}</span> */}
                    <Badge variant={day.status === "present" ? "default" : "destructive"}>
                      {day.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Goals - Update to reflect fetched data if goals are dynamic */}
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
