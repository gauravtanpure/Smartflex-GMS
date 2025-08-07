// src/pages/ManageSessions.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { Trash2, Edit, Users, CalendarCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface SessionSchedule {
  id: number;
  trainer_id: number;
  session_name: string; // ISO date string
  session_date: string; // ISO date string
  start_time: string; // HH:MM:SS string
  end_time: string; // HH:MM:SS string
  branch_name: string;
  max_capacity: number;
  description: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  branch: string | null;
}

interface SessionAttendance {
  id: number;
  session_id: number;
  user_id: number;
  status: string;
  attendance_date: string; // ISO date string
  user: User; // Nested user object
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const ManageSessions: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trainerId = parseInt(localStorage.getItem("user_id") || "0");
  const trainerBranch = localStorage.getItem("branch");
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const [newSession, setNewSession] = useState({
    session_name: "",
    session_date: today,
    start_time: "",
    end_time: "",
    max_capacity: 0,
    description: "",
  });
  const [editingSession, setEditingSession] = useState<SessionSchedule | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null);
  const [viewingAttendanceSession, setViewingAttendanceSession] = useState<SessionSchedule | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [attendanceStatus, setAttendanceStatus] = useState<{ [userId: number]: string }>({});
  const [usersInBranch, setUsersInBranch] = useState<User[]>([]);

  // Fetch sessions created by the trainer
  const { data: sessions, isLoading: isLoadingSessions, error: sessionsError } = useQuery<SessionSchedule[]>({
    queryKey: ["trainerSessions", trainerId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
    enabled: !!trainerId,
  });

  // Fetch users in the trainer's branch
  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["branchUsers", trainerBranch],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/users/branch-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
    enabled: !!trainerBranch,
  });

  useEffect(() => {
    if (users) {
      setUsersInBranch(users);
      // Initialize attendance status for all users to 'absent' by default
      const initialStatus: { [userId: number]: string } = {};
      users.forEach(user => {
        initialStatus[user.id] = "absent";
      });
      setAttendanceStatus(initialStatus);
    }
  }, [users]);


  // Fetch attendance for a specific session
  const { data: sessionAttendance, isLoading: isLoadingSessionAttendance, refetch: refetchSessionAttendance } = useQuery<SessionAttendance[]>({
    queryKey: ["sessionAttendance", viewingAttendanceSession?.id, attendanceDate],
    queryFn: async () => {
      if (!viewingAttendanceSession?.id) return [];
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/sessions/${viewingAttendanceSession.id}/attendance?attendance_date=${attendanceDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch session attendance");
      }
      return response.json();
    },
    enabled: !!viewingAttendanceSession?.id, // Only run when a session is selected for attendance
    onSuccess: (data) => {
      // Update attendanceStatus based on fetched data
      const updatedStatus: { [userId: number]: string } = {};
      usersInBranch.forEach(user => {
        const record = data.find(att => att.user_id === user.id);
        updatedStatus[user.id] = record ? record.status : "absent";
      });
      setAttendanceStatus(updatedStatus);
    }
  });


  // Mutation for creating a session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: typeof newSession) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerSessions"] });
      setNewSession({
        session_name: "",
        session_date: today,
        start_time: "",
        end_time: "",
        max_capacity: 0,
        description: "",
      });
      toast({ title: "Success", description: "Session created successfully." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create session: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a session
  const updateSessionMutation = useMutation({
    mutationFn: async (sessionData: SessionSchedule) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/sessions/${sessionData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_name: sessionData.session_name,
          session_date: sessionData.session_date,
          start_time: sessionData.start_time,
          end_time: sessionData.end_time,
          max_capacity: sessionData.max_capacity,
          description: sessionData.description,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerSessions"] });
      setEditingSession(null);
      toast({ title: "Success", description: "Session updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update session: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainerSessions"] });
      setDeleteSessionId(null);
      toast({ title: "Success", description: "Session deleted successfully." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete session: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for marking/updating session attendance
  const manageAttendanceMutation = useMutation({
    mutationFn: async ({ sessionId, userId, status, attendanceDate }: { sessionId: number, userId: number, status: string, attendanceDate: string }) => {
      const token = localStorage.getItem("token");
      // First, try to fetch existing attendance to determine if it's a POST or PUT
      const existingAttendanceResponse = await fetch(
        `${API_BASE_URL}/trainers/sessions/${sessionId}/attendance?user_id=${userId}&attendance_date=${attendanceDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let existingAttendanceRecord = null;
      if (existingAttendanceResponse.ok) {
        const data = await existingAttendanceResponse.json();
        // The backend `get_session_attendance` returns a list, so we need to find the specific record
        existingAttendanceRecord = data.find((att: SessionAttendance) => att.user_id === userId && att.attendance_date === attendanceDate);
      }

      const payload = {
        session_id: sessionId,
        user_id: userId,
        status: status,
        attendance_date: attendanceDate,
      };

      let response;
      if (existingAttendanceRecord) {
        // If record exists, update it
        response = await fetch(`${API_BASE_URL}/trainers/sessions/attendance/${existingAttendanceRecord.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // If no record, create new
        response = await fetch(`${API_BASE_URL}/trainers/sessions/${sessionId}/attendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to manage attendance");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchSessionAttendance(); // Refetch attendance for the current session
      toast({ title: "Success", description: "Attendance updated successfully." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update attendance: ${error.message}`,
        variant: "destructive",
      });
    },
  });


  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate(newSession);
  };

  const handleUpdateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      updateSessionMutation.mutate(editingSession);
    }
  };

  const confirmDeleteSession = () => {
    if (deleteSessionId) {
      deleteSessionMutation.mutate(deleteSessionId);
    }
  };

  const handleMarkAttendance = async (userId: number, status: string) => {
    if (viewingAttendanceSession) {
      setAttendanceStatus(prev => ({ ...prev, [userId]: status })); // Optimistic update
      await manageAttendanceMutation.mutateAsync({
        sessionId: viewingAttendanceSession.id,
        userId,
        status,
        attendanceDate: attendanceDate,
      });
    }
  };

  const handleAttendanceDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceDate(e.target.value);
    // When date changes, attendance status needs to be re-initialized based on new fetch
    // This will be handled by the onSuccess of refetchSessionAttendance
  };

  if (isLoadingSessions || isLoadingUsers) {
    return <div className="text-center py-8">Loading sessions and users...</div>;
  }

  if (sessionsError) {
    return <div className="text-center py-8 text-red-500">Error: {sessionsError.message}</div>;
  }

  if (usersError) {
    return <div className="text-center py-8 text-red-500">Error fetching users: {usersError.message}</div>;
  }

  return (
    <div className="container mx-auto p-4" font-poppins>
      <h1 className="text-3xl font-bold mb-6" style={{ color: "#6b7e86" }}>Manage Sessions</h1>

      {/* Create New Session Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Session</CardTitle>
          <CardDescription>Schedule a new training session for your branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_name">Session Name</Label>
              <Input
                id="session_name"
                value={newSession.session_name}
                onChange={(e) => setNewSession({ ...newSession, session_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="session_date">Date</Label>
              <Input
                id="session_date"
                type="date"
                value={newSession.session_date}
                onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                required
                min={today}
              />
            </div>
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={newSession.start_time}
                onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={newSession.end_time}
                onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                value={newSession.max_capacity}
                onChange={(e) => setNewSession({ ...newSession, max_capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSession.description}
                onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full" disabled={createSessionMutation.isPending}>
                {createSessionMutation.isPending ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>Manage your scheduled training sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length === 0 ? (
            <p className="text-center text-muted-foreground">No sessions created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.session_name}</TableCell>
                    <TableCell>{format(parseISO(session.session_date), "PPP")}</TableCell>
                    <TableCell>{`${session.start_time.substring(0, 5)} - ${session.end_time.substring(0, 5)}`}</TableCell>
                    <TableCell>{session.max_capacity}</TableCell>
                    <TableCell>{session.branch_name}</TableCell>
                    <TableCell className="text-right flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingAttendanceSession(session);
                          setAttendanceDate(format(parseISO(session.session_date), "yyyy-MM-dd")); // Set attendance date to session date
                          // Initial fetch will happen via query enabled prop
                        }}
                        title="Manage Attendance"
                      >
                        <CalendarCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSession({ ...session, session_date: format(parseISO(session.session_date), 'yyyy-MM-dd') })}
                        title="Edit Session"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteSessionId(session.id)}
                        title="Delete Session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Session Dialog */}
      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
              <DialogDescription>
                Make changes to your session here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSession} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_session_name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit_session_name"
                  value={editingSession.session_name}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, session_name: e.target.value })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_session_date" className="text-right">
                  Date
                </Label>
                <Input
                  id="edit_session_date"
                  type="date"
                  value={editingSession.session_date}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, session_date: e.target.value })
                  }
                  className="col-span-3"
                  required
                  min={today}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_start_time" className="text-right">
                  Start Time
                </Label>
                <Input
                  id="edit_start_time"
                  type="time"
                  value={editingSession.start_time.substring(0, 5)} // Show only HH:MM
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, start_time: e.target.value + ":00" }) // Add seconds back for backend
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_end_time" className="text-right">
                  End Time
                </Label>
                <Input
                  id="edit_end_time"
                  type="time"
                  value={editingSession.end_time.substring(0, 5)} // Show only HH:MM
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, end_time: e.target.value + ":00" }) // Add seconds back for backend
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_max_capacity" className="text-right">
                  Capacity
                </Label>
                <Input
                  id="edit_max_capacity"
                  type="number"
                  value={editingSession.max_capacity}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, max_capacity: parseInt(e.target.value) || 0 })
                  }
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit_description"
                  value={editingSession.description || ""}
                  onChange={(e) =>
                    setEditingSession({ ...editingSession, description: e.target.value })
                  }
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateSessionMutation.isPending}>
                  {updateSessionMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the session and all associated attendance records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSessionId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSession} disabled={deleteSessionMutation.isPending}>
              {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Attendance Dialog */}
      {viewingAttendanceSession && (
        <Dialog open={!!viewingAttendanceSession} onOpenChange={() => setViewingAttendanceSession(null)}>
          <DialogContent className="sm:max-w-[700px] flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Manage Attendance for "{viewingAttendanceSession.session_name}"</DialogTitle>
              <DialogDescription>
                <p>Date: {format(parseISO(viewingAttendanceSession.session_date), "PPP")}</p>
                <p>Time: {`${viewingAttendanceSession.start_time.substring(0, 5)} - ${viewingAttendanceSession.end_time.substring(0, 5)}`}</p>
                <p>Mark attendance for users in this session on a specific date.</p>
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 border-b">
              <div className="flex items-center space-x-2">
                <Label htmlFor="attendance_date_filter">Attendance Date:</Label>
                <Input
                  id="attendance_date_filter"
                  type="date"
                  value={attendanceDate}
                  onChange={handleAttendanceDateChange}
                  className="w-auto"
                  min={today}
                />
                <Button onClick={() => refetchSessionAttendance()} disabled={isLoadingSessionAttendance}>
                  {isLoadingSessionAttendance ? "Loading..." : "Refresh"}
                </Button>
              </div>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              {isLoadingUsers || isLoadingSessionAttendance ? (
                <p>Loading users and attendance data...</p>
              ) : usersInBranch.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found in your branch.</p>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersInBranch.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={attendanceStatus[user.id] || "absent"}
                            onValueChange={(value) => handleMarkAttendance(user.id, value)}
                            disabled={manageAttendanceMutation.isPending}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleMarkAttendance(user.id, attendanceStatus[user.id] || "absent")}
                            disabled={manageAttendanceMutation.isPending}
                            size="sm"
                          >
                            {manageAttendanceMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter className="p-6 pt-2">
              <Button variant="outline" onClick={() => setViewingAttendanceSession(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManageSessions;