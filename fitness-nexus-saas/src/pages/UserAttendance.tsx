import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";

interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  date: string;
  status: string;
  branch: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function UserAttendance() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const branch = localStorage.getItem("userBranch");
    setUserRole(role);
    if (role === "admin" || role === "trainer") {
      setFilterBranch(branch || ""); // Set branch filter for admin/trainer
    }
  }, []);

  const fetchAttendance = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You are not logged in. Please log in to view attendance.",
        variant: "destructive",
      });
      return [];
    }

    let url = `http://localhost:8000/users/branch-attendance?`;
    if (selectedDate) {
      url += `attendance_date=${format(selectedDate, "yyyy-MM-dd")}&`;
    }
    if (filterUserId) {
      url += `user_id=${filterUserId}&`;
    }
    if (userRole === "superadmin" && filterBranch) {
        url += `branch=${filterBranch}&`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch attendance records.");
      }
      return await response.json();
    } catch (error: any) {
      toast({
        title: "Error fetching attendance",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return [];
    }
  };

  const { data: attendanceRecords, isLoading, isError, error, refetch } = useQuery<AttendanceRecord[], Error>({
    queryKey: ["attendanceRecords", selectedDate, filterUserId, filterBranch, userRole],
    queryFn: fetchAttendance,
    enabled: !!userRole, // Only enable query once userRole is determined
  });

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    refetch(); // Refetch data when date changes
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterUserId(e.target.value);
  };

  const handleBranchChange = (value: string) => {
    setFilterBranch(value);
  };

  const handleApplyFilters = () => {
    refetch(); // Manually refetch when filters are applied
  };

  const branchOptions = [
    "Downtown",
    "Uptown",
    "Midtown",
    "Eastside",
    "Westside",
  ]; // Example branches, ideally fetched from backend

  if (isError) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">User Attendance</h2>
        <div className="text-red-500">Error: {error?.message || "Failed to load attendance."}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold mb-6 text-gray-900" style={{ fontFamily: "Montserrat, sans-serif" }}>
        User Attendance Overview 📋
      </h2>

      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-xl shadow-md">
        {/* Date Picker */}
        <div className="flex items-center space-x-2">
          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">Filter by Date:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-filter"
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* User ID Filter */}
        <div className="flex items-center space-x-2">
          <label htmlFor="user-id-filter" className="text-sm font-medium text-gray-700">Filter by User ID:</label>
          <Input
            id="user-id-filter"
            type="number"
            placeholder="Enter User ID"
            value={filterUserId}
            onChange={handleUserIdChange}
            className="w-[180px] rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </div>

        {/* Branch Filter (only for Superadmin) */}
        {userRole === "superadmin" && (
          <div className="flex items-center space-x-2">
            <label htmlFor="branch-filter" className="text-sm font-medium text-gray-700">Filter by Branch:</label>
            <Select onValueChange={handleBranchChange} value={filterBranch}>
              <SelectTrigger id="branch-filter" className="w-[180px] rounded-md border-gray-300 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105">
          Apply Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
          <p className="ml-2 text-lg text-gray-600">Loading attendance records...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md p-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 uppercase text-xs text-gray-700">
                <TableHead className="py-3 px-6 text-left font-bold rounded-tl-lg">User ID</TableHead>
                <TableHead className="py-3 px-6 text-left font-bold">User Name</TableHead>
                <TableHead className="py-3 px-6 text-left font-bold">Date</TableHead>
                <TableHead className="py-3 px-6 text-left font-bold">Status</TableHead>
                <TableHead className="py-3 px-6 text-left font-bold rounded-tr-lg">Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords && attendanceRecords.length > 0 ? (
                attendanceRecords.map((record) => (
                  <TableRow key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                    <TableCell className="py-3 px-6">{record.user_id}</TableCell>
                    <TableCell className="py-3 px-6 font-medium">{record.user_name}</TableCell>
                    <TableCell className="py-3 px-6">{format(new Date(record.date), "PPP")}</TableCell>
                    <TableCell className="py-3 px-6">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold",
                          record.status === "Present" && "bg-green-100 text-green-800",
                          record.status === "Absent" && "bg-red-100 text-red-800",
                          record.status === "Leave" && "bg-yellow-100 text-yellow-800",
                          record.status === "Unknown" && "bg-gray-100 text-gray-800",
                        )}
                      >
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-6">{record.branch}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    No attendance records found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
