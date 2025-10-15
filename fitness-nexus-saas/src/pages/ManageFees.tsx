import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Fee {
  id: number;
  user_id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  branch_name: string;
  assigned_by_user_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    branch: string | null;
  };
}

interface Plan {
  id: number;
  plan_name: string;
  price: number;
}

export default function ManageFees() {
  const [users, setUsers] = useState<User[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearch, setUserSearch] = useState(""); // 🔍 Added user search
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const [loadingFeeId, setLoadingFeeId] = useState<number | null>(null); // ⏳ Loader for status update
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const feesPerPage = 6;
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersRes, plansRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/users/branch-users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/membership-plans/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setUsers(usersRes.data);
        setPlans(plansRes.data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load users or plans.",
          variant: "destructive",
        });
      }
    };

    fetchInitialData();
    fetchBranchFees();
  }, [token]);

  // 🧭 Fixed search functionality
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchBranchFees();
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchBranchFees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees/branch`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = res.data.filter((fee: Fee) => {
        if (!searchQuery) return true;
        const search = searchQuery.toLowerCase();
        return (
          fee.user?.name?.toLowerCase().includes(search) ||
          fee.user?.email?.toLowerCase().includes(search)
        );
      });
      setFees(filtered);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load fees.",
        variant: "destructive",
      });
    }
  };

  const handlePlanChange = (value: string) => {
    const selectedPlan = plans.find(p => p.id.toString() === value);
    if (selectedPlan) {
      setForm({
        ...form,
        plan_id: selectedPlan.id.toString(),
        fee_type: selectedPlan.plan_name,
        amount: selectedPlan.price.toString(),
      });
    } else {
      setForm({ ...form, plan_id: "", fee_type: "", amount: "" });
    }
  };

  const handleSendNotification = async () => {
    if (!form.user_id || !form.fee_type || !form.amount || !form.due_date) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields to assign a new fee.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/fees/`,
        {
          user_id: parseInt(form.user_id),
          fee_type: form.fee_type,
          amount: parseFloat(form.amount),
          due_date: form.due_date,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast({
        title: "Success",
        description: "Fee assigned successfully!",
        className: "bg-green-100 text-green-800",
      });
      fetchBranchFees();
      setForm({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
    } catch (error: any) {
      toast({
        title: "Fee Assignment Failed",
        description: error.response?.data?.detail || "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  // ⏳ Added loader here
  const handleTogglePaidStatus = async (feeId: number, currentStatus: boolean) => {
    setLoadingFeeId(feeId);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/fees/${feeId}/status`,
        { is_paid: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Status Updated",
        description: `Fee marked as ${!currentStatus ? "Paid" : "Unpaid"}.`,
        className: "bg-blue-100 text-blue-800",
      });
      fetchBranchFees();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    } finally {
      setLoadingFeeId(null);
    }
  };

  const filteredFees = fees.filter(fee => {
    if (filterStatus === "paid") return fee.is_paid;
    if (filterStatus === "unpaid") return !fee.is_paid;
    return true;
  });

  const exportToCSV = () => {
    const rows = [
      ["User Name", "Email", "Fee Type", "Amount", "Due Date", "Branch", "Status"],
      ...filteredFees.map(fee => [
        fee.user?.name || "N/A",
        fee.user?.email || "N/A",
        fee.fee_type,
        `₹${fee.amount.toFixed(2)}`,
        fee.due_date,
        fee.branch_name || "N/A",
        fee.is_paid ? "Paid" : "Unpaid"
      ])
    ];

    const csvContent = rows.map(row => row.map(item => `"${item}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee_assignments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredFees.length / feesPerPage);
  const paginatedFees = filteredFees.slice(
    (currentPage - 1) * feesPerPage,
    currentPage * feesPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // 🔍 Filter users for user search
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Manage Fees</h2>
        <Button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Assign Fee */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-logoOrange">Assign New Fee</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 🔍 Added search box for user dropdown */}
            <div className="space-y-1">
              <Label htmlFor="user-search">Search User</Label>
              <Input
                id="user-search"
                placeholder="Search by name or email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={form.user_id} onValueChange={value => setForm({ ...form, user_id: value })}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="plan-select">Select Plan</Label>
              <Select value={form.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger id="plan-select">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.plan_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" value={form.amount} readOnly className="bg-gray-50" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
              />
            </div>

            <Button onClick={handleSendNotification} className="bg-green-600 hover:bg-green-700">
              Assign Fee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <Input
          type="text"
          placeholder="Search by user name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "paid" | "unpaid")}>
          <SelectTrigger className="md:w-[200px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredFees.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 border border-dashed rounded-lg">
              <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No fee assignments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFees.map(fee => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.user?.name} ({fee.user?.email})</TableCell>
                      <TableCell>{fee.fee_type}</TableCell>
                      <TableCell>₹{fee.amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(fee.due_date).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell>{fee.branch_name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          className={fee.is_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {fee.is_paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleTogglePaidStatus(fee.id, fee.is_paid)}
                          disabled={loadingFeeId === fee.id}
                          className={fee.is_paid ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}
                        >
                          {loadingFeeId === fee.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : fee.is_paid ? (
                            "Mark Unpaid"
                          ) : (
                            "Mark Paid"
                          )}
                        </Button>
                      </TableCell>
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
