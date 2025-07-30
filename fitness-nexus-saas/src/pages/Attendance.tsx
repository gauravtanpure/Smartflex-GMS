import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface UserAttendanceRecord {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD format
  status: string;
  branch: string;
  type: 'general'; // Added to distinguish types
}

interface SessionAttendanceRecord {
  id: number;
  session_id: number;
  user_id: number;
  status: string;
  attendance_date: string; // YYYY-MM-DD format
  session?: {
    id: number;
    session_name: string;
    trainer_id: number;
    branch_name: string;
  };
  type: 'session'; // Added to distinguish types
}

type CombinedAttendanceRecord = UserAttendanceRecord | SessionAttendanceRecord;

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState<CombinedAttendanceRecord[]>([]);
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

      // Fetch general user attendance
      const userAttendanceRes = await fetch("http://localhost:8000/users/my-attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let userAttendance: UserAttendanceRecord[] = [];
      if (userAttendanceRes.ok) {
        const userData = await userAttendanceRes.json();
        userAttendance = userData.map((record: any) => ({ ...record, type: 'general' as const }));
      }

      // Fetch session attendance - we need to get all sessions first, then attendance for each
      const sessionsRes = await fetch("http://localhost:8000/trainers/public-sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let sessionAttendance: SessionAttendanceRecord[] = [];
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        const currentUserId = parseInt(localStorage.getItem("user_id") || "0");

        // For each session, fetch attendance records for the current user
        const attendancePromises = sessions.map(async (session: any) => {
          try {
            const attendanceRes = await fetch(
              `http://localhost:8000/trainers/sessions/${session.id}/attendance?user_id=${currentUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (attendanceRes.ok) {
              const sessionAttendanceData = await attendanceRes.json();
              return sessionAttendanceData.map((record: any) => ({
                ...record,
                type: 'session' as const,
                session: {
                  id: session.id,
                  session_name: session.session_name,
                  trainer_id: session.trainer_id,
                  branch_name: session.branch_name,
                }
              }));
            }
            return [];
          } catch (error) {
            console.warn(`Failed to fetch attendance for session ${session.id}:`, error);
            return [];
          }
        });

        const attendanceResults = await Promise.all(attendancePromises);
        sessionAttendance = attendanceResults.flat();
      }

      // Combine both types of attendance
      const combinedAttendance = [...userAttendance, ...sessionAttendance];

      // Sort by date descending (most recent first)
      const sortedData = combinedAttendance.sort((a, b) => {
        const dateA = a.type === 'general' ? a.date : a.attendance_date;
        const dateB = b.type === 'general' ? b.date : b.attendance_date;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setAttendanceData(sortedData);

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

  const generalAttendance = attendanceData.filter(record => record.type === 'general') as UserAttendanceRecord[];
  const sessionAttendance = attendanceData.filter(record => record.type === 'session') as SessionAttendanceRecord[];

  const presentDays = generalAttendance.filter(record => record.status === "present").length;
  const totalDays = generalAttendance.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const getRecordDate = (record: CombinedAttendanceRecord): string => {
    return record.type === 'general' ? record.date : record.attendance_date;
  };

  const getRecordTitle = (record: CombinedAttendanceRecord): string => {
    if (record.type === 'general') {
      return "General Attendance";
    } else {
      return record.session?.session_name || "Session Attendance";
    }
  };

  const getRecordSubtitle = (record: CombinedAttendanceRecord): string => {
    if (record.type === 'general') {
      return `Branch: ${record.branch}`;
    } else {
      return `Session • ${record.session?.branch_name || 'Unknown Branch'}`;
    }
  };

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
          <span>{attendancePercentage}% Overall</span>
        </Badge>
      </div>

      {/* Attendance Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span>Days Present (General)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{presentDays}</div>
              <p className="text-sm text-muted-foreground">out of {totalDays} general records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-destructive" />
                <span>Days Absent (General)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{totalDays - presentDays}</div>
              <p className="text-sm text-muted-foreground">missed general check-ins</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>General Attendance Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{attendancePercentage}%</div>
              <Progress value={attendancePercentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* --- */}

      {/* General Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>General Gym Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={`gen-load-${i}`} className="animate-pulse flex items-center space-x-4 p-4 rounded-lg border">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : generalAttendance.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No general gym attendance records found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check in at the gym to see your general attendance here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generalAttendance.map((record) => (
                <div key={`general-${record.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      record.status === "present"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {record.status === "present" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">General Attendance</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">Branch: {record.branch}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant={record.status === "present" ? "default" : "destructive"}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- */}

      {/* Session Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span>Session Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={`sess-load-${i}`} className="animate-pulse flex items-center space-x-4 p-4 rounded-lg border">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : sessionAttendance.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No session attendance records found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Book and attend some sessions to see your attendance here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionAttendance.map((record) => (
                <div key={`session-${record.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      record.status === "present"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-rose-100 text-rose-600"
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {new Date(record.attendance_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground">Session: {record.session?.session_name || 'N/A'}</p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">Branch: {record.session?.branch_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant={record.status === "present" ? "default" : "destructive"}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
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
                <span>{Math.min(presentDays, 5)}/5 days</span>
              </div>
              <Progress value={Math.min((presentDays / 5) * 100, 100)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>General Consistency Rate (Goal: 80%)</span>
                <span>{attendancePercentage}%</span>
              </div>
              <Progress value={Math.min(attendancePercentage, 100)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}