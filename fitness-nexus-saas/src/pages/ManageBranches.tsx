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
import { useToast } from "@/components/ui/use-toast";

// Define the interface for an Admin (which is essentially a User with role 'admin')
interface Admin {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  gender: string; // Add the gender field to the Admin interface
  role: string;
  branch: string;
}

// Define the interface for a Branch, grouping admins
interface Branch {
  name: string;
  admins: Admin[];
}

export default function ManageBranches() {
  const branchNames = ["Pune Branch", "Mumbai Branch", "Nagpur Branch"];

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [newAdmin, setNewAdmin] = useState<Admin>({
    name: "",
    email: "",
    password: "",
    phone: "",
    gender: "", // Initialize gender state
    role: "admin",
    branch: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const openDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    // Reset newAdmin form fields and set the branch for the new admin, including gender
    setNewAdmin({
      name: "",
      email: "",
      password: "",
      phone: "",
      gender: "", // Reset gender field
      role: "admin",
      branch: branch.name,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBranch(null);
    setNewAdmin({ // Reset form completely on close
      name: "", email: "", password: "", phone: "", gender: "", role: "admin", branch: ""
    });
  };

  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch("http://localhost:8000/users/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to fetch users from backend.");
      }

      const data: Admin[] = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected data format from server. Expected an array of users.");
      }

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

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    // Basic validation, now including gender
    if (
      !selectedBranch ||
      !newAdmin.name.trim() ||
      !newAdmin.email.trim() ||
      !newAdmin.password?.trim() ||
      !newAdmin.gender?.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, Password, Gender).",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch("http://localhost:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          phone: newAdmin.phone || "1234567890",
          gender: newAdmin.gender, // Send the gender field
          role: "admin",
          branch: selectedBranch.name,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        toast({
          title: "Failed to add admin",
          description: err.detail || "An error occurred on the server.",
          variant: "destructive",
        });
        return;
      }

      await fetchAdmins();
      toast({
        title: "Success",
        description: "Admin added successfully ✅",
        variant: "success",
      });
      closeDialog();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Server Error",
        description: (error as Error).message || "An unexpected server error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-boldd text-foreground text-logoOrange">Manage Branches</h1>

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
                <CardTitle className="text-logoOrange">{branch.name}</CardTitle>
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
  <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto sm:rounded-lg p-6">
    <DialogHeader>
      <DialogTitle className="text-xl font-boldd">
        Admins of {selectedBranch?.name}
      </DialogTitle>
    </DialogHeader>

    {/* Display existing admins */}
    <div className="space-y-4 mb-6">
      {selectedBranch?.admins.length === 0 ? (
        <p className="text-muted-foreground">
          No admins assigned to this branch yet.
        </p>
      ) : (
        selectedBranch?.admins.map((admin, i) => (
          <div
            key={i}
            className="border p-3 rounded-md bg-muted/20 flex flex-col sm:flex-row sm:justify-between sm:items-center"
          >
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {admin.name}</p>
              <p><strong>Email:</strong> {admin.email}</p>
              <p><strong>Phone:</strong> {admin.phone || "N/A"}</p>
              <p><strong>Gender:</strong> {admin.gender || "N/A"}</p>
            </div>
          </div>
        ))
      )}
    </div>

    {/* Add New Admin Form */}
    <div className="border-t pt-4 mt-4 space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">
        Add New Admin to {selectedBranch?.name}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={newAdmin.name}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, name: e.target.value })
            }
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
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, email: e.target.value })
            }
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
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Input
            id="gender"
            value={newAdmin.gender}
            onChange={(e) =>
              setNewAdmin({ ...newAdmin, gender: e.target.value })
            }
            placeholder="Enter gender (e.g., Male/Female/Other)"
            required
          />
        </div>
      </div>
      <Button
        className="w-full mt-2"
        onClick={handleAddAdmin}
        disabled={
          !newAdmin.name.trim() ||
          !newAdmin.email.trim() ||
          !newAdmin.password?.trim() ||
          !newAdmin.gender?.trim()
        }
      >
        Add Admin
      </Button>
    </div>

    <DialogFooter className="pt-4">
      <Button variant="outline" className="w-full" onClick={closeDialog}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}