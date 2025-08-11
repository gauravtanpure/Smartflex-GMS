// src/pages/ManagePTORequests.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const fetchAllPTORequests = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/trainers/pto-requests`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch PTO requests.");
  }
  return response.json();
};

const approvePTORequest = async (requestId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/trainers/pto-request/${requestId}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to approve PTO request.");
  }
  return response.json();
};

const rejectPTORequest = async (requestId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/trainers/pto-request/${requestId}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to reject PTO request.");
  }
  return response.json();
};

const ManagePTORequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: ptoRequests,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allPTORequests"],
    queryFn: fetchAllPTORequests,
  });

  const approveMutation = useMutation({
    mutationFn: approvePTORequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPTORequests"] });
      toast({
        title: "Request Approved",
        description: "PTO request has been successfully approved.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to approve PTO request.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectPTORequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPTORequests"] });
      toast({
        title: "Request Rejected",
        description: "PTO request has been successfully rejected.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to reject PTO request.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id) => {
    rejectMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-logoOrange">Manage PTO Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-logoOrange">Pending & Past Requests</CardTitle>
          <CardDescription>
            Review all paid time off requests from trainers in your branch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading requests...</p>}
          {error && <p className="text-red-500">Error: {error.message}</p>}
          {ptoRequests && ptoRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ptoRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.trainer?.name || "N/A"}</TableCell>
                    <TableCell>
                      {format(new Date(req.start_date), "PPP")} -{" "}
                      {format(new Date(req.end_date), "PPP")}
                    </TableCell>
                    <TableCell>{req.reason || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "green"
                            : req.status === "rejected"
                            ? "red"
                            : "yellow"
                        }
                      >
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" ? (
                        <div className="flex space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" disabled={approveMutation.isPending || rejectMutation.isPending}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve PTO Request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve this PTO request from {req.trainer_user?.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleApprove(req.id)}>Approve</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" disabled={approveMutation.isPending || rejectMutation.isPending}>
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject PTO Request?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject this PTO request from {req.trainer_user?.name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleReject(req.id)}>Reject</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No action needed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No PTO requests found for your branch.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagePTORequests;