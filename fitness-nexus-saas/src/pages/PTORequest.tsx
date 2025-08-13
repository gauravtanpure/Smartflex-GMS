// src/pages/PTORequest.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isFuture } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keeping Input for consistency, though not directly used in the form
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Info } from "lucide-react"; // Added Loader2 and Info icons
import { cn } from "@/lib/utils"; // cn utility for conditional class names

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Define interface for PTO request data
interface PTORequestData {
  id: number;
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const fetchMyPTORequests = async (): Promise<PTORequestData[]> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }
  const response = await fetch(`${API_URL}/trainers/my-pto-requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch PTO requests");
  }
  return response.json();
};

const createPTORequest = async (newRequest: { start_date: string; end_date: string; reason: string }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }
  const response = await fetch(`${API_URL}/trainers/pto-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newRequest),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create PTO request");
  }
  return response.json();
};

const PTORequest = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");

  const {
    data: ptoRequests,
    isLoading,
    error,
  } = useQuery<PTORequestData[]>({
    queryKey: ["myPTORequests"],
    queryFn: fetchMyPTORequests,
  });

  const createRequestMutation = useMutation({
    mutationFn: createPTORequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPTORequests"] });
      toast({
        title: "PTO Request Submitted",
        description: "Your PTO request has been successfully submitted for approval.",
        className: "bg-green-100 text-green-800", // Custom class for success toast
      });
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit PTO request.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please select both a start and an end date.",
        variant: "destructive",
      });
      return;
    }
    if (startDate > endDate) {
      toast({
        title: "Validation Error",
        description: "Start date cannot be after end date.",
        variant: "destructive",
      });
      return;
    }
    // Check if startDate is in the future relative to the start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
    if (startDate < today) {
      toast({
        title: "Validation Error",
        description: "The start date must be today or in the future.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      reason,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-poppins">
      <h1 className="text-3xl sm:text-4xl font-boldd text-logoOrange mb-6">Request Paid Time Off</h1>

      {/* Submit New Request Card */}
      <Card className="mb-8 rounded-lg shadow-md border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-boldd text-logoOrange">Submit a New Request</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Fill out the form below to request time off from work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-base">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base h-11",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      // Disable past dates and dates beyond a reasonable future (e.g., 1 year from now)
                      disabled={(date) => date < new Date().setHours(0,0,0,0) || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-base">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal text-base h-11",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      // Disable past dates and dates beyond a reasonable future (e.g., 1 year from now)
                      disabled={(date) => date < new Date().setHours(0,0,0,0) || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-base">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] text-base"
              />
            </div>
            <Button
              type="submit"
              disabled={createRequestMutation.isPending}
              className="w-full sm:w-auto px-6 py-3 text-lg font-semibold bg-logoOrange hover:bg-orange-600 transition-colors"
            >
              {createRequestMutation.isPending ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PTO Request History Card */}
      <Card className="rounded-lg shadow-md border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-boldd text-gray-800">My PTO Request History</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            A list of all your submitted time off requests and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-10 w-10 animate-spin text-logoOrange" />
              <p className="ml-4 text-lg text-gray-600">Loading requests...</p>
            </div>
          )}
          {error && (
            <div className="text-center py-8 border border-dashed rounded-lg text-red-600 bg-red-50">
              <Info className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-lg font-medium">Error loading PTO requests:</p>
              <p className="mt-2 text-sm">{error.message}</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["myPTORequests"] })} className="mt-4 bg-red-500 hover:bg-red-600">
                Retry Fetching
              </Button>
            </div>
          )}
          {!isLoading && !error && ptoRequests && ptoRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full text-base">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Start Date</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">End Date</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden sm:table-cell">Reason</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden md:table-cell">Requested On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ptoRequests.map((req) => (
                    <TableRow key={req.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4">{format(new Date(req.start_date), "PPP")}</TableCell>
                      <TableCell className="py-3 px-4">{format(new Date(req.end_date), "PPP")}</TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{req.reason || "N/A"}</TableCell>
                      <TableCell className="py-3 px-4">
                        <span
                          className={`font-semibold px-2 py-1 rounded-full text-xs sm:text-sm
                            ${req.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : req.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground hidden md:table-cell">{format(new Date(req.created_at), "PPP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !isLoading && !error && ptoRequests?.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-lg text-gray-500 bg-gray-50">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">You have not submitted any PTO requests yet.</p>
              <p className="text-sm mt-2">Submit a new request using the form above!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PTORequest;