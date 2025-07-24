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

interface Admin {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  branch: string; // ✅ added this
}

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
    branch: "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setNewAdmin({ name: "", email: "", password: "", phone: "", branch: branch.name });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedBranch(null);
  };

  const fetchAdmins = async () => {
    const res = await fetch("http://localhost:8000/users/admins");
    const data = await res.json();

    const grouped: Branch[] = branchNames.map((name) => ({
      name,
      admins: data.filter((admin: Admin) => admin.branch === name),
    }));

    setBranches(grouped);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (
      selectedBranch &&
      newAdmin.name.trim() &&
      newAdmin.email.trim() &&
      newAdmin.password?.trim()
    ) {
      try {
        const response = await fetch("http://localhost:8000/users/add-admin", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newAdmin.name,
            email: newAdmin.email,
            password: newAdmin.password,
            phone: newAdmin.phone || "1234567890",
            role: "admin",
            branch: selectedBranch.name, // ✅ Include branch here
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          alert(err.detail || "Failed to add admin");
          return;
        }

        await fetchAdmins();
        alert("Admin added successfully ✅");
        closeDialog();
      } catch (error) {
        console.error(error);
        alert("Server error. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Manage Branches</h1>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admins of {selectedBranch?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-64 overflow-y-auto">
            {selectedBranch?.admins.map((admin, i) => (
              <div
                key={i}
                className="border p-3 rounded-md flex justify-between items-center"
              >
                <div>
                  <p><strong>Name:</strong> {admin.name}</p>
                  <p><strong>Email:</strong> {admin.email}</p>
                  <p><strong>Phone:</strong> {admin.phone}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-4 space-y-3">
            <h3 className="font-semibold text-lg">Add New Admin</h3>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Enter admin name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="Enter admin email"
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
            </div>
            <Button className="mt-2" onClick={handleAddAdmin}>
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
