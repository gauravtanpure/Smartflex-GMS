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
import { Input } from "@/components/ui/input";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const fetchMyPTORequests = async () => {
  const token = localStorage.getItem("token");
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

const createPTORequest = async (newRequest) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/trainers/pto-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newRequest),
  });
  if (!response.ok) {
    throw new Error("Failed to create PTO request");
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
  } = useQuery({
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

  const handleSubmit = (e) => {
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
    if (!isFuture(startDate)) {
      toast({
        title: "Validation Error",
        description: "The start date must be in the future.",
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Request Paid Time Off</h1>
      <Card>
        <CardHeader>
          <CardTitle>Submit a New Request</CardTitle>
          <CardDescription>
            Fill out the form below to request time off from work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date() || date > new Date("2026-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => date < new Date() || date > new Date("2026-01-01")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My PTO Request History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading requests...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {ptoRequests && ptoRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ptoRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{format(new Date(req.start_date), "PPP")}</TableCell>
                    <TableCell>{format(new Date(req.end_date), "PPP")}</TableCell>
                    <TableCell>{req.reason || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`font-semibold ${
                          req.status === "approved"
                            ? "text-green-600"
                            : req.status === "rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(req.created_at), "PPP")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>You have not submitted any PTO requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PTORequest;