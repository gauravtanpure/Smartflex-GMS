// src/pages/TrainerUsers.tsx
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface User {
  name: string;
  email: string;
  phone: string;
  role: string;
  branch: string;
}

export default function TrainerUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State to hold error message as a string
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
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
        const data: User[] = await res.json();
        setUsers(data);
      } else {
        let errorMsg = "Failed to fetch users.";
        try {
          const errorData = await res.json();
          // Try to get a specific detail, otherwise stringify the whole error object
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch (jsonError) {
          // If res.json() itself fails (e.g., non-JSON response), use the status text
          errorMsg = res.statusText || "Unknown error occurred while parsing response.";
        }
        setError(errorMsg); // Ensure error state is always a string
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      // Ensure the error message is always a string
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred.";
      setError(errorMessage); // Ensure error state is always a string
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 space-y-6" font-poppins>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Branch Users</h1>
        <Button onClick={fetchUsers} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" /> {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users in Your Branch</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading users...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p> // This will now always render a string
          ) : users.length === 0 ? (
            <p>No users found in your branch.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.branch}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
