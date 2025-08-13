// src/pages/ManageMembershipPlans.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea"; // For description
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

interface MembershipPlan {
  id: number;
  plan_name: string;
  description: string;
  price: number;
  duration_months: number;
  branch_name: string;
  is_approved: boolean; // ⬅️ NEW FIELD
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const fetchMembershipPlans = async (userRole: string | null, userBranch: string | null): Promise<MembershipPlan[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found.");

  let url = `${API_BASE_URL}/membership-plans/`;
  // The backend already handles role-based filtering (admin sees only approved for their branch, superadmin sees all).
  // No explicit frontend query parameter filtering needed here for general fetch.
  // The `branch_name` and `is_approved` filtering logic is primarily on the backend.

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch membership plans.");
  }
  return response.json();
};


const createMembershipPlan = async (planData: Omit<MembershipPlan, "id" | "created_at" | "updated_at" | "is_approved" >): Promise<MembershipPlan> => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found.");
    // The backend will set `is_approved` based on the role creating the plan.
    // For admins, it will be false (needs superadmin approval).
    // For superadmins, it will be true by default.

    const response = await fetch(`${API_BASE_URL}/membership-plans/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(planData), // Send payload as is, backend handles default branch and approval
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create membership plan.");
    }
    return response.json();
};

const updateMembershipPlan = async (plan: MembershipPlan): Promise<MembershipPlan> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found.");

  // Only send the fields that can be updated.
  // The backend prevents admins from changing `is_approved`.
  const payload: Partial<MembershipPlan> = {
    plan_name: plan.plan_name,
    description: plan.description,
    price: plan.price,
    duration_months: plan.duration_months,
  };

  if (localStorage.getItem("role") === "superadmin") {
      payload.is_approved = plan.is_approved; // Superadmin can update approval status
  }

  const response = await fetch(`${API_BASE_URL}/membership-plans/${plan.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update membership plan.");
  }
  return response.json();
};

const deleteMembershipPlan = async (planId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found.");
  const response = await fetch(`${API_BASE_URL}/membership-plans/${planId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete membership plan.");
  }
};

const ManageMembershipPlans = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const userRole = localStorage.getItem("role");
  const userBranch = localStorage.getItem("branch");

  const { data: plans, isLoading, error } = useQuery<MembershipPlan[], Error>({
    queryKey: ["membershipPlans", userRole, userBranch], // Include role and branch in query key
    queryFn: () => fetchMembershipPlans(userRole, userBranch),
  });

  const createMutation = useMutation<MembershipPlan, Error, Omit<MembershipPlan, "id" | "created_at" | "updated_at" | "is_approved">, unknown>({
    mutationFn: createMembershipPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membershipPlans"] });
      toast({ title: "Success", description: "Membership plan created successfully. Awaiting superadmin approval (if applicable)." });
      setNewPlan({ plan_name: "", description: "", price: 0, duration_months: 0, branch_name: "" });
      setIsCreateDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create membership plan.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation<MembershipPlan, Error, MembershipPlan, unknown>({
    mutationFn: updateMembershipPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membershipPlans"] });
      toast({ title: "Success", description: "Membership plan updated successfully." });
      setEditDialogOpen(false);
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update membership plan.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation<void, Error, number, unknown>({
    mutationFn: deleteMembershipPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membershipPlans"] });
      toast({ title: "Success", description: "Membership plan deleted successfully." });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message || "Failed to delete membership plan.",
        variant: "destructive",
      });
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Omit<MembershipPlan, "id" | "created_at" | "updated_at" | "is_approved">>({
    plan_name: "",
    description: "",
    price: 0,
    duration_months: 0,
    branch_name: "", // Will be set by backend if admin
  });

  const handleCreateNewPlan = () => {
    // Filter out branch_name if admin, as backend will set it
    const payload = userRole === "admin" ? { ...newPlan, branch_name: undefined } : newPlan;
    createMutation.mutate(payload);
  };

  const handleUpdatePlan = () => {
    if (selectedPlan) {
      updateMutation.mutate(selectedPlan);
    }
  };

  const handleDeletePlan = (id: number) => {
    if (window.confirm("Are you sure you want to delete this membership plan?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading membership plans...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // No explicit frontend filtering needed here as backend handles it based on role
  // Superadmin gets all, Admin gets only approved for their branch.
  const displayedPlans = plans || [];

  return (
    <div className="container mx-auto p-4" font-poppins>
      <div className="flex justify-between items-center mb-6" >
        <h1 className="text-3xl font-boldd text-logoOrange">Manage Membership Plans</h1>
        {(userRole === "admin" || userRole === "superadmin") && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create New Plan</Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full bg-white">
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price (₹)</TableHead>
              <TableHead>Duration (Months)</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Approved</TableHead> {/* ⬅️ NEW COLUMN */}
              {(userRole === "admin" || userRole === "superadmin") && (
                <TableHead>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No membership plans found.</TableCell>
                </TableRow>
              ) : (
                displayedPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.plan_name}</TableCell>
                <TableCell>{plan.description}</TableCell>
                <TableCell>{plan.price.toFixed(2)}</TableCell>
                <TableCell>{plan.duration_months}</TableCell>
                <TableCell>{plan.branch_name || "N/A"}</TableCell>
                <TableCell>
                    <Checkbox checked={plan.is_approved} disabled /> {/* Display status, not editable here */}
                </TableCell>
                {(userRole === "admin" || userRole === "superadmin") && (
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            )))}
          </TableBody>
        </Table>
      </div>

      {/* Create New Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} font-poppins>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Membership Plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan_name" className="text-right">
                Plan Name
              </Label>
              <Input
                id="plan_name"
                value={newPlan.plan_name}
                onChange={(e) => setNewPlan({ ...newPlan, plan_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (₹)
              </Label>
              <Input
                id="price"
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration_months" className="text-right">
                Duration (Months)
              </Label>
              <Input
                id="duration_months"
                type="number"
                value={newPlan.duration_months}
                onChange={(e) => setNewPlan({ ...newPlan, duration_months: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            {userRole === "superadmin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="branch_name" className="text-right">
                        Branch Name
                    </Label>
                    <Input
                        id="branch_name"
                        value={newPlan.branch_name || ""}
                        onChange={(e) => setNewPlan({ ...newPlan, branch_name: e.target.value || null })}
                        className="col-span-3"
                        placeholder="Leave empty for general plans"
                    />
                </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleCreateNewPlan}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Membership Plan</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_plan_name" className="text-right">
                  Plan Name
                </Label>
                <Input
                  id="edit_plan_name"
                  value={selectedPlan.plan_name}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, plan_name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit_description"
                  value={selectedPlan.description}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, description: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_price" className="text-right">
                  Price (₹)
                </Label>
                <Input
                  id="edit_price"
                  type="number"
                  value={selectedPlan.price}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, price: parseFloat(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_duration_months" className="text-right">
                  Duration (Months)
                </Label>
                <Input
                  id="edit_duration_months"
                  type="number"
                  value={selectedPlan.duration_months}
                  onChange={(e) =>
                    setSelectedPlan({ ...selectedPlan, duration_months: parseInt(e.target.value) })
                  }
                  className="col-span-3"
                />
              </div>
              {userRole === "superadmin" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_approved" className="text-right">
                    Approved
                  </Label>
                  <Checkbox
                    id="is_approved"
                    checked={selectedPlan.is_approved}
                    onCheckedChange={(checked) =>
                      setSelectedPlan({ ...selectedPlan, is_approved: Boolean(checked) })
                    }
                    className="col-span-3"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageMembershipPlans;