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
import { Check, X, Loader2, Info } from "lucide-react";
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

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;

interface TrainerUser {
  name: string;
}

interface PTORequest {
  id: number;
  trainer_user: TrainerUser;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const fetchAllPTORequests = async (): Promise<PTORequest[]> => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }
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

const approvePTORequest = async (requestId: number) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }
  const response = await fetch(`${API_URL}/trainers/pto-request/${requestId}/approve`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to approve PTO request.");
  }
  return response.json();
};

const rejectPTORequest = async (requestId: number) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }
  const response = await fetch(`${API_URL}/trainers/pto-request/${requestId}/reject`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to reject PTO request.");
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
  } = useQuery<PTORequest[]>({
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
        className: "bg-green-100 text-green-800",
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
        variant: "destructive",
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

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: number) => {
    rejectMutation.mutate(id);
  };

  const pendingRequests = ptoRequests?.filter(req => req.status === 'pending');
  const otherRequests = ptoRequests?.filter(req => req.status !== 'pending');

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen font-poppins">
      <h1 className="text-2xl sm:text-2xl font-boldd text-logoOrange mb-6">Manage PTO Requests</h1>

      {/* Pending Requests */}
      <Card className="mb-8 rounded-lg shadow-md border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-boldd text-gray-800">Pending Requests</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Review and take action on new paid time off requests.
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
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["allPTORequests"] })} className="mt-4 bg-red-500 hover:bg-red-600">
                Retry Fetching
              </Button>
            </div>
          )}
          {!isLoading && !error && pendingRequests && pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full text-base">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Trainer</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden sm:table-cell">Dates</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden lg:table-cell">Reason</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((req) => (
                    <TableRow key={req.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4 font-medium">{req.trainer?.name || "N/A"}</TableCell>
                      <TableCell className="py-3 px-4 hidden sm:table-cell">
                        {format(new Date(req.start_date), "PPP")} -{" "}
                        {format(new Date(req.end_date), "PPP")}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{req.reason || "N/A"}</TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex space-x-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" disabled={approveMutation.isPending || rejectMutation.isPending}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[425px]">
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
                            <AlertDialogContent className="sm:max-w-[425px]">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !isLoading && !error && pendingRequests?.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-lg text-gray-500 bg-gray-50">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No pending PTO requests at this time.</p>
              <p className="text-sm mt-2">All requests have been reviewed.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* All Requests History */}
      <Card className="rounded-lg shadow-md border-gray-100">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-boldd text-gray-800">Request History</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            View all past approved and rejected requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoading && !error && otherRequests && otherRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full text-base">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Trainer</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden sm:table-cell">Dates</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700 hidden lg:table-cell">Reason</TableHead>
                    <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherRequests.map((req) => (
                    <TableRow key={req.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3 px-4 font-medium">{req.trainer?.name || "N/A"}</TableCell>
                      <TableCell className="py-3 px-4 hidden sm:table-cell">
                        {format(new Date(req.start_date), "PPP")} -{" "}
                        {format(new Date(req.end_date), "PPP")}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{req.reason || "N/A"}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge
                          variant={
                            req.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                          className="px-2 py-1 text-xs sm:text-sm"
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : !isLoading && !error && otherRequests?.length === 0 && (
            <div className="text-center py-8 border border-dashed rounded-lg text-gray-500 bg-gray-50">
              <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No past requests found.</p>
              <p className="text-sm mt-2">History will appear here once requests are approved or rejected.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagePTORequests;