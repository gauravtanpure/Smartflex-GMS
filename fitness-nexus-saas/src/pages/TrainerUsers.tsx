import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface User {
  name: string;
  email: string;
  phone: string;
  role: string;
  branch: string;
}

const USERS_PER_PAGE = 10;

export default function TrainerUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found. Please log in.");

      const res = await fetch("http://localhost:8000/users/branch-users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data: User[] = await res.json();
        setUsers(data);
        setCurrentPage(1); // Reset to page 1 on refresh
      } else {
        let errorMsg = "Failed to fetch users.";
        try {
          const errorData = await res.json();
          errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData);
        } catch {
          errorMsg = res.statusText || "Unknown error occurred.";
        }
        setError(errorMsg);
        toast({ title: "Error", description: errorMsg, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = (err instanceof Error ? err.message : String(err)) || "An unexpected error occurred.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
  const startIndex = (currentPage - 1) * USERS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + USERS_PER_PAGE);

  return (
    <div className="p-6 space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-boldd text-logoOrange">
          My Branch Users
        </h1>
        <Button onClick={fetchUsers} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {loading ? "Refreshing..." : "Refresh"}
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
            <p className="text-red-500">{error}</p>
          ) : users.length === 0 ? (
            <p>No users found in your branch.</p>
          ) : (
            <>
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
                    {currentUsers.map((user) => (
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

              {/* Pagination */}
              <div className="flex justify-center items-center gap-4 pt-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  variant="outline"
                >
                  Prev
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
