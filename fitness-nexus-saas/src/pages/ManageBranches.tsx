import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"; // Import useToast

// Define the interface for an Admin (which is essentially a User with role 'admin')
interface Admin {
  id?: number; // Add id as it might be returned from backend
  name: string;
  email: string;
  password?: string; // Optional for creation, not returned on fetch
  phone?: string;
  role: string; // Should be 'admin'
  branch: string;
}

// Define the interface for a Branch, grouping admins
interface Branch {
  name: string;
  admins: Admin[];
}

export default function ManageBranches() {
  // Use a fixed list of branch names for demonstration.
  // In a real app, you might fetch these from a /branches API endpoint.
  const branchNames = ["Pune Branch", "Mumbai Branch", "Nagpur Branch"];

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [newAdmin, setNewAdmin] = useState<Admin>({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin", // Default role for new admin
    branch: "", // Will be set when a branch is selected
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const { toast } = useToast(); // Initialize toast

  // Function to open the dialog for a specific branch
  const openDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    // Reset newAdmin form fields and set the branch for the new admin
    setNewAdmin({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "admin",
      branch: branch.name,
    });
    setDialogOpen(true);
  };

  // Function to close the dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBranch(null);
    setNewAdmin({ // Reset form completely on close
      name: "", email: "", password: "", phone: "", role: "admin", branch: ""
    });
  };

  // Function to fetch all users and filter them into branches
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token"); // Get token for authorization
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Fetch ALL users from the backend
      const res = await fetch("http://localhost:8000/users/", {
        headers: {
          Authorization: `Bearer ${token}`, // Include the token
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch users from backend.");
      }

      const data: Admin[] = await res.json(); // Data should be an array of users

      // IMPORTANT: Add a defensive check if data is not an array
      if (!Array.isArray(data)) {
        throw new Error("Unexpected data format from server. Expected an array of users.");
      }

      // Group users by branch, filtering for 'admin' role
      const grouped: Branch[] = branchNames.map((name) => ({
        name,
        admins: data.filter((user: Admin) => user.role === "admin" && user.branch === name),
      }));

      setBranches(grouped);
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError((err as Error).message);
      toast({
        title: "Error",
        description: (err as Error).message || "An unexpected error occurred while fetching admins.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch admins when the component mounts
  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handler for adding a new admin
  const handleAddAdmin = async () => {
    // Basic validation
    if (
      !selectedBranch ||
      !newAdmin.name.trim() ||
      !newAdmin.email.trim() ||
      !newAdmin.password?.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, Password).",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      // Use the general user creation endpoint
      const response = await fetch("http://localhost:8000/users/", { // Correct endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          phone: newAdmin.phone || "1234567890", // Provide a default phone if optional
          role: "admin", // Explicitly set role to 'admin'
          branch: selectedBranch.name, // Assign to the selected branch
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        // Use toast for error messages
        toast({
          title: "Failed to add admin",
          description: err.detail || "An error occurred on the server.",
          variant: "destructive",
        });
        return;
      }

      // If successful, refetch admins and show success toast
      await fetchAdmins();
      toast({
        title: "Success",
        description: "Admin added successfully ✅",
        variant: "success",
      });
      closeDialog(); // Close the dialog
    } catch (error) {
      console.error("Error adding admin:", error);
      // Use toast for server errors
      toast({
        title: "Server Error",
        description: (error as Error).message || "An unexpected server error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Branches</h1>

      {loading ? (
        <p>Loading branches and admins...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch, index) => (
            <Card
              key={index}
              onClick={() => openDialog(branch)}
              className="cursor-pointer hover:shadow-lg transition"
            >
              <CardHeader>
                <CardTitle>{branch.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Admins: {branch.admins.length}
                </p>
                {branch.admins.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>Assigned Admins:</p>
                    <ul className="list-disc list-inside">
                      {branch.admins.map((admin, adminIndex) => (
                        <li key={adminIndex}>{admin.name} ({admin.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog for managing admins in a selected branch */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Admins of {selectedBranch?.name}</DialogTitle>
          </DialogHeader>

          {/* Display existing admins */}
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2"> {/* Added pr-2 for scrollbar space */}
            {selectedBranch?.admins.length === 0 ? (
              <p className="text-muted-foreground">No admins assigned to this branch yet.</p>
            ) : (
              selectedBranch?.admins.map((admin, i) => (
                <div
                  key={i}
                  className="border p-3 rounded-md flex justify-between items-center bg-card"
                >
                  <div>
                    <p><strong>Name:</strong> {admin.name}</p>
                    <p><strong>Email:</strong> {admin.email}</p>
                    <p><strong>Phone:</strong> {admin.phone || 'N/A'}</p>
                  </div>
                  {/* You can add edit/delete buttons here if needed */}
                </div>
              ))
            )}
          </div>

          {/* Form to add new admin */}
          <div className="border-t pt-4 mt-4 space-y-3">
            <h3 className="font-semibold text-lg">Add New Admin to {selectedBranch?.name}</h3>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Enter admin name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="Enter admin email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newAdmin.phone}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, phone: e.target.value })
                  }
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>
            <Button className="w-full mt-2" onClick={handleAddAdmin}>
              Add Admin
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
