// src/pages/TrainerAttendance.tsx
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  name: string;
  email: string;
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
  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatus, setAttendanceStatus] = useState("present");
  const [bulkAttendance, setBulkAttendance] = useState<{ [userId: number]: string }>({});

  // States for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Display 10 rows per page

  // States for delete confirmation dialog
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  const { toast } = useToast();

  /**
   * Fetches users belonging to the trainer's branch from the backend.
   * Handles authentication, data parsing, and error reporting.
   */
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
        if (!Array.isArray(rawData)) {
          throw new Error("Unexpected data format from server for branch users. Expected an array.");
        }
        const validUsers = rawData.filter((user: User) => user.id !== undefined && user.id !== null);
        setBranchUsers(validUsers);
        // Pre-select the first user if adding a new record and no user is selected yet
        if (!currentRecord && validUsers.length > 0 && !selectedUserId) {
          setSelectedUserId(String(validUsers[0].id));
        }
      } else {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        setError(errorData.detail || "Failed to fetch branch users.");
        toast({
          title: "Error",
          description: errorData.detail || "Failed to fetch branch users.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = (err instanceof Error ? err.message : String(err));
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Fetches attendance records for the trainer's branch from the backend.
   * Handles loading state, errors, and updates the attendance records list.
   */
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
        setCurrentPage(1); // Reset to the first page on refresh
      } else {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        setError(errorData.detail || "Failed to fetch attendance records.");
        toast({
          title: "Error",
          description: errorData.detail || "Failed to fetch attendance records.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = (err instanceof Error ? err.message : String(err));
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

  // Effect hook to fetch initial data on component mount
  useEffect(() => {
    fetchBranchUsers();
    fetchAttendanceRecords();
  }, []);

  /**
   * Handles opening the add/edit attendance modal.
   * Pre-fills form fields if editing an existing record, otherwise resets them.
   * @param record - Optional AttendanceRecord object to pre-fill the form for editing.
   */
  const handleAddEdit = (record?: AttendanceRecord) => {
    if (record) {
      setCurrentRecord(record);
      setSelectedUserId(String(record.user_id));
      setAttendanceDate(record.date);
      setAttendanceStatus(record.status);
      setBulkAttendance({ [record.user_id]: record.status }); // Pre-fill for bulk edit if editing
    } else {
      setCurrentRecord(null);
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setAttendanceStatus("present");
      setSelectedUserId("");
      setBulkAttendance({}); // Clear bulk attendance when adding new
    }
    setIsModalOpen(true);
  };

  /**
   * Handles the submission of the attendance form (for bulk marking).
   * Sends attendance data to the backend API.
   * @param e - React Form Event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
      return;
    }

    // Construct payload for bulk attendance
    const payload = Object.entries(bulkAttendance).map(([userId, status]) => ({
      user_id: parseInt(userId),
      date: attendanceDate,
      status,
    }));

    if (payload.length === 0) {
      toast({ title: "Validation Error", description: "Please mark at least one user's attendance.", variant: "destructive" });
      return;
    }

    try {
      // Always use POST for bulk attendance, even if it's conceptually an "edit"
      // The backend should handle upsert logic for existing records based on user_id and date
      const res = await fetch("http://localhost:8000/users/bulk-attendance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Attendance submitted successfully.", variant: "success" });
        setIsModalOpen(false);
        fetchAttendanceRecords(); // Refresh the list
      } else {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        toast({ title: "Error", description: errorData.detail || "Failed to submit attendance.", variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = (err instanceof Error ? err.message : String(err));
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  /**
   * Initiates the delete confirmation dialog for a specific attendance record.
   * @param record - The AttendanceRecord to be deleted.
   */
  const handleDeleteClick = (record: AttendanceRecord) => {
    setRecordToDelete(record);
    setIsConfirmModalOpen(true);
  };

  /**
   * Executes the deletion of an attendance record after confirmation.
   * Sends a DELETE request to the backend API.
   */
  const confirmDelete = async () => {
    if (!recordToDelete) return; // Should not happen if modal is properly managed

    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Error", description: "Authentication token missing.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/users/manage-attendance/${recordToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast({ title: "Success", description: "Attendance record deleted successfully.", variant: "success" });
        fetchAttendanceRecords(); // Refresh the list
      } else {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        toast({ title: "Error", description: errorData.detail || "Failed to delete attendance record.", variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = (err instanceof Error ? err.message : String(err));
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsConfirmModalOpen(false); // Close confirmation modal
      setRecordToDelete(null); // Clear record to delete
    }
  };

  /**
   * Cancels the delete operation and closes the confirmation dialog.
   */
  const cancelDelete = () => {
    setIsConfirmModalOpen(false);
    setRecordToDelete(null);
  };

  /**
   * Helper function to get the user's name from their ID.
   * @param userId - The ID of the user.
   * @returns The user's name or a placeholder if not found.
   */
  const getUserName = (userId: number) => {
    const user = branchUsers.find(u => u.id === userId);
    return user ? user.name : `User ID: ${userId} (Unknown)`;
  };

  // Pagination logic: Calculate current records to display
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = useMemo(() => attendanceRecords.slice(indexOfFirstRecord, indexOfLastRecord), [attendanceRecords, indexOfFirstRecord, indexOfLastRecord]);
  const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);

  /**
   * Changes the current page for pagination.
   * @param pageNumber - The page number to navigate to.
   */
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  /**
   * Navigates to the next page, if available.
   */
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  /**
   * Navigates to the previous page, if available.
   */
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-2 space-y-6 font-poppins">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: "#6b7e86" }}>Manage My Branch Attendance</h1>
        <div className="flex space-x-2">
          <Button onClick={fetchAttendanceRecords} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={() => handleAddEdit()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Mark Attendance
          </Button>
        </div>
      </div>

      {/* Attendance Records Card */}
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
            <>
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
                    {currentRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{getUserName(record.user_id)}</TableCell>
                        <TableCell>{new Date(record.date).toLocaleDateString("en-GB")}</TableCell>
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
                            onClick={() => handleDeleteClick(record)} // Use handleDeleteClick for confirmation
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 pt-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  variant="outline"
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  variant="outline"
                >
                  Next
                </Button>
              </div>            
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Attendance Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Mark Attendance for Multiple Users</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="flex items-center gap-4">
              <Label htmlFor="attendance-date">Select Date:</Label>
              <Input
                id="attendance-date"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                required
              />
            </div>

            <div className="max-h-[400px] overflow-auto border rounded-md p-4">
              {branchUsers.length === 0 ? (
                <p>No users available</p>
              ) : (
                branchUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {["present", "absent", "late"].map((status) => (
                        <label key={status} className="flex items-center gap-1 text-sm">
                          <input
                            type="radio"
                            name={`status-${user.id}`}
                            value={status}
                            checked={bulkAttendance[user.id] === status}
                            onChange={() =>
                              setBulkAttendance((prev) => ({ ...prev, [user.id]: status }))
                            }
                            required
                          />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={Object.keys(bulkAttendance).length === 0}>
                Submit Attendance
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the attendance record for{" "}
            <span className="font-semibold">
              {recordToDelete ? getUserName(recordToDelete.user_id) : "this user"}
            </span>{" "}
            on{" "}
            <span className="font-semibold">
              {recordToDelete ? new Date(recordToDelete.date).toLocaleDateString("en-GB") : "this date"}
            </span>
            ? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
