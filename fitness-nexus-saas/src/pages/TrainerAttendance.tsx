// src/pages/TrainerAttendance.tsx
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, PlusCircle, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  name: string;
  email: string;
  // Add role and branch if you want to display them in the dropdown or filter
  role?: string;
  branch?: string;
}

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD format
  status: string;
  branch: string;
}

export default function TrainerAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [branchUsers, setBranchUsers] = useState<User[]>([]); // Users for the current trainer's branch
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State to hold error message as a string
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [attendanceStatus, setAttendanceStatus] = useState("present");

  const { toast } = useToast();

  const fetchBranchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }
      const res = await fetch("http://localhost:8000/users/branch-users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const rawData = await res.json();
        console.log("Fetched raw users data:", rawData); // Log raw data

        // Ensure data is an array before processing
        if (!Array.isArray(rawData)) {
            throw new Error("Unexpected data format from server for branch users. Expected an array.");
        }

        // Filter out users without a valid ID to prevent React key warnings
        const validUsers = rawData.filter((user: User) => {
            if (user.id === undefined || user.id === null) {
                console.warn("User without a valid ID found:", user); // Warn if ID is missing
                return false;
            }
            return true;
        });
        console.log("Valid users after ID filter:", validUsers); // Log filtered data

        setBranchUsers(validUsers);
        // If adding a new record and there are users, pre-select the first one
        if (!currentRecord && validUsers.length > 0 && !selectedUserId) {
            setSelectedUserId(String(validUsers[0].id));
        }
      } else {
        let errorMsg = "Failed to fetch branch users for attendance.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          errorMsg = res.statusText || "Unknown error occurred while parsing branch user response.";
        }
        setError(errorMsg); // Ensure error state is always a string
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching branch users:", err);
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred while fetching branch users.";
      setError(errorMessage); // Ensure error state is always a string
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      const res = await fetch("http://localhost:8000/users/branch-attendance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data: AttendanceRecord[] = await res.json();
        setAttendanceRecords(data);
      } else {
        let errorMsg = "Failed to fetch attendance records.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          errorMsg = res.statusText || "Unknown error occurred while parsing attendance response.";
        }
        setError(errorMsg); // Ensure error state is always a string
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching attendance records:", err);
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred.";
      setError(errorMessage); // Ensure error state is always a string
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
    fetchBranchUsers();
    fetchAttendanceRecords();
  }, []);

  const handleAddEdit = (record?: AttendanceRecord) => {
    if (record) {
      setCurrentRecord(record);
      setSelectedUserId(String(record.user_id));
      setAttendanceDate(record.date);
      setAttendanceStatus(record.status);
    } else {
      // When adding a new record, reset fields and pre-select first user if available
      setCurrentRecord(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setAttendanceStatus("present");
      // Only pre-select if there are valid users available
      if (branchUsers.length > 0) {
        setSelectedUserId(String(branchUsers[0].id));
      } else {
        setSelectedUserId(""); // No users to select
      }
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
      return;
    }

    // Ensure user_id is a number and a user is selected
    const userIdAsNumber = parseInt(selectedUserId);
    if (isNaN(userIdAsNumber) || !selectedUserId) {
        toast({ title: "Validation Error", description: "Please select a valid user.", variant: "destructive" });
        return;
    }

    const payload = {
      user_id: userIdAsNumber,
      date: attendanceDate,
      status: attendanceStatus,
    };

    try {
      let res;
      if (currentRecord) {
        // Edit existing record
        res = await fetch(`http://localhost:8000/users/manage-attendance/${currentRecord.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Add new record
        res = await fetch("http://localhost:8000/users/manage-attendance", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast({ title: "Success", description: `Attendance record ${currentRecord ? "updated" : "added"} successfully.`, variant: "success" });
        setIsModalOpen(false);
        fetchAttendanceRecords(); // Refresh the list
      } else {
        let errorMsg = "Failed to save attendance record.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          errorMsg = res.statusText || "Unknown error occurred while parsing save attendance response.";
        }
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      }
    } catch (err) {
      console.error("Error saving attendance record:", err);
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred while saving attendance.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    // Replaced window.confirm with a toast-based confirmation if needed,
    // but for quick testing, a simple confirm is often used.
    // For production, consider a custom confirmation dialog component.
    if (!confirm("Are you sure you want to delete this attendance record?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/users/manage-attendance/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast({ title: "Success", description: "Attendance record deleted successfully.", variant: "success" });
        fetchAttendanceRecords(); // Refresh the list
      } else {
        let errorMsg = "Failed to delete attendance record.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          errorMsg = res.statusText || "Unknown error occurred while parsing delete attendance response.";
        }
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      }
    } catch (err) {
      console.error("Error deleting attendance record:", err);
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred while deleting attendance.";
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  // Helper to get user name from ID
  const getUserName = (userId: number) => {
    const user = branchUsers.find(u => u.id === userId);
    return user ? user.name : `User ID: ${userId} (Unknown)`;
  };


  return (
    <div className="p-6 space-y-6" font-poppins>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage My Branch Attendance</h1>
        <div className="flex space-x-2">
          <Button onClick={fetchAttendanceRecords} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={() => handleAddEdit()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading attendance records...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : attendanceRecords.length === 0 ? (
            <p>No attendance records found for your branch.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{getUserName(record.user_id)}</TableCell>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>{record.branch}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddEdit(record)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentRecord ? "Edit Attendance Record" : "Add New Attendance Record"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <Select
                onValueChange={setSelectedUserId}
                value={selectedUserId}
                disabled={!!currentRecord || branchUsers.length === 0} // Disable if editing or no users
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={branchUsers.length === 0 ? "No users available" : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {branchUsers.length === 0 ? (
                    <p className="p-2 text-muted-foreground">No users found in your branch.</p>
                  ) : (
                    branchUsers.map(user => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name} ({user.email}) {user.role && ` - ${user.role}`} {/* Display role if available */}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select onValueChange={setAttendanceStatus} value={attendanceStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={branchUsers.length === 0}> {/* Disable submit if no users */}
                {currentRecord ? "Save Changes" : "Add Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
