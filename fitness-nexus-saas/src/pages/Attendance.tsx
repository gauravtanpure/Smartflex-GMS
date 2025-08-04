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

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          {/* ONLY this heading will be faint orange */}
          <h1 className="text-4xl font-extrabold text-logoOrange mb-2">My Attendance</h1>
          <p className="text-lg text-muted-foreground">Track your gym check-ins and session consistency.</p>
        </div>
        <Badge variant="outline" className="mt-4 sm:mt-0 px-4 py-2 text-md font-semibold flex items-center space-x-2 bg-white shadow-sm border-gray-200">
          <TrendingUp className="w-4 h-4 text-logoOrange" />
          <span>Overall Consistency: <span className="text-logoOrange">{attendancePercentage}%</span></span>
        </Badge>
      </div>

      {/* Attendance Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-xl shadow-sm border-gray-100 animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="rounded-xl shadow-sm border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-700">
            <p className="font-semibold text-lg">Error loading attendance data:</p>
            <p className="mt-2">{error}</p>
            <button
              onClick={fetchMyAttendance}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-xl shadow-md border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-gray-800 font-semibold"> {/* Changed back to gray-800 */}
                <CheckCircle className="w-5 h-5 text-success" />
                <span>Days Present (General)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-success">{presentDays}</div>
              <p className="text-sm text-muted-foreground">out of {totalDays} general records</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-gray-800 font-semibold"> {/* Changed back to gray-800 */}
                <XCircle className="w-5 h-5 text-destructive" />
                <span>Days Absent (General)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive">{totalDays - presentDays}</div>
              <p className="text-sm text-muted-foreground">missed general check-ins</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-md border-gray-100 transition-transform duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-gray-800 font-semibold"> {/* Changed back to gray-800 */}
                <TrendingUp className="w-5 h-5 text-logoOrange" />
                <span>General Attendance Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-logoOrange">{attendancePercentage}%</div>
              <Progress value={attendancePercentage} className="mt-2 h-2 [&>*]:bg-logoOrange" /> {/* Progress bar keeps orange fill */}
              <p className="text-xs text-muted-foreground mt-1">Based on general gym visits.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* General Attendance List */}
      <Card className="rounded-xl shadow-md mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center space-x-3 text-gray-800"> {/* Changed back to gray-800 */}
            <Clock className="w-6 h-6 text-gray-600" /> {/* Icon color adjusted */}
            <span>General Gym Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={`gen-load-${i}`} className="animate-pulse flex items-center space-x-4 p-4 rounded-lg border bg-gray-100">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : generalAttendance.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg text-gray-500 bg-gray-50">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No general gym attendance records found.</p>
              <p className="text-sm mt-2">
                Check in at the gym to see your attendance history here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generalAttendance.map((record) => (
                <div key={`general-${record.id}`} className="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm hover:bg-gray-50 transition-colors duration-200 ease-in-out">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                      record.status === "present"
                        ? "bg-success/80"
                        : "bg-destructive/80"
                    }`}>
                      {record.status === "present" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>General Check-in</span>
                        <span className="text-gray-400">•</span>
                        <span>Branch: {record.branch}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={record.status === "present" ? "default" : "destructive"} className="px-3 py-1 text-base font-semibold">
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Attendance List */}
      <Card className="rounded-xl shadow-md mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center space-x-3 text-gray-800"> {/* Changed back to gray-800 */}
            <Users className="w-6 h-6 text-gray-600" /> {/* Icon color adjusted */}
            <span>Session Attendance History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={`sess-load-${i}`} className="animate-pulse flex items-center space-x-4 p-4 rounded-lg border bg-gray-100">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : sessionAttendance.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg text-gray-500 bg-gray-50">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No session attendance records found.</p>
              <p className="text-sm mt-2">
                Book and attend some sessions to see your attendance here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionAttendance.map((record) => (
                <div key={`session-${record.id}`} className="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm hover:bg-gray-50 transition-colors duration-200 ease-in-out">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                      record.status === "present"
                        ? "bg-purple-600/80"
                        : "bg-rose-600/80"
                    }`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg text-gray-800">
                        {record.session?.session_name || 'Unknown Session'}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(record.attendance_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>Branch: {record.session?.branch_name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={record.status === "present" ? "default" : "destructive"} className="px-3 py-1 text-base font-semibold">
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card className="rounded-xl shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold flex items-center space-x-3 text-gray-800"> {/* Changed back to gray-800 */}
            <TrendingUp className="w-6 h-6 text-gray-600" /> {/* Icon color adjusted */}
            <span>Weekly Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center text-base mb-2 font-medium text-gray-700">
                <span>Workout Days (Goal: 5 days/week)</span>
                <span><span className="text-logoOrange font-bold">{Math.min(presentDays, 5)}</span>/5 days</span>
              </div>
              <Progress value={Math.min((presentDays / 5) * 100, 100)} className="h-3 bg-gray-200 [&>*]:bg-logoOrange" />
            </div>
            <div>
              <div className="flex justify-between items-center text-base mb-2 font-medium text-gray-700">
                <span>General Consistency Rate (Goal: 80%)</span>
                <span><span className="text-logoOrange font-bold">{attendancePercentage}</span>%</span>
              </div>
              <Progress value={Math.min(attendancePercentage, 100)} className="h-3 bg-gray-200 [&>*]:bg-logoOrange" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}