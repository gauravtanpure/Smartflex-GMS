import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users as UsersIcon, Download, DollarSign, Search, Filter, ChevronLeft, ChevronRight, Info } from "lucide-react";
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
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">("all");
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const feesPerPage = 6;

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const usersRes = await axios.get("http://localhost:8000/users/branch-users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersRes.data);

        const plansRes = await axios.get("http://localhost:8000/membership-plans/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPlans(plansRes.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load users or plans. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchInitialData();
    fetchBranchFees();
  }, [token]);

  useEffect(() => {
    fetchBranchFees();
  }, [searchQuery]);

  const fetchBranchFees = () => {
    axios
      .get(`http://localhost:8000/fees/branch?search_query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setFees(res.data))
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load fees. Please try again.",
          variant: "destructive",
        });
      });
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

  const handleSendNotification = () => {
    if (!form.user_id || !form.fee_type || !form.amount || !form.due_date) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields to assign a new fee.",
        variant: "destructive",
      });
      return;
    }

    axios
      .post("http://localhost:8000/fees", {
        user_id: parseInt(form.user_id),
        fee_type: form.fee_type,
        amount: parseFloat(form.amount),
        due_date: form.due_date,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        toast({
          title: "Success",
          description: "Fee assigned successfully!",
          className: "bg-green-100 text-green-800",
        });
        fetchBranchFees();
        setForm({ user_id: "", plan_id: "", fee_type: "", amount: "", due_date: "" });
      })
      .catch(error => {
        toast({
          title: "Fee Assignment Failed",
          description: error.response?.data?.detail || "An unknown error occurred.",
          variant: "destructive",
        });
      });
  };

  const handleTogglePaidStatus = (feeId: number, currentStatus: boolean) => {
    axios
      .put(`http://localhost:8000/fees/${feeId}/status`, { is_paid: !currentStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        toast({
          title: "Status Updated",
          description: `Fee marked as ${!currentStatus ? "Paid" : "Unpaid"}.`,
          className: "bg-blue-100 text-blue-800",
        });
        fetchBranchFees();
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to update payment status. Please try again.",
          variant: "destructive",
        });
      });
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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-poppins">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-boldd text-gray-900">Manage Fees</h2>
        <Button onClick={exportToCSV} className="w-full sm:w-auto flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Assign New Fee Card */}
      <Card className="mb-8 shadow-sm rounded-lg border-gray-100">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-boldd text-logoOrange">Assign New Fee</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={form.user_id} onValueChange={value => setForm({ ...form, user_id: value })}>
                <SelectTrigger id="user-select" className="w-full">
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="plan-select">Select Plan</Label>
              <Select value={form.plan_id} onValueChange={handlePlanChange}>
                <SelectTrigger id="plan-select" className="w-full">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.plan_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount-input">Amount</Label>
              <Input
                id="amount-input"
                type="number"
                placeholder="Amount"
                value={form.amount}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="due-date-input">Due Date</Label>
              <Input
                id="due-date-input"
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
              />
            </div>

            <Button
              onClick={handleSendNotification}
              className="w-full md:col-span-2 lg:col-span-1 xl:col-span-1 mt-auto py-2.5 bg-green-600 hover:bg-green-700"
            >
              Assign Fee
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="w-full md:w-1/2">
          <Input
            type="text"
            placeholder="Search by user name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="w-full md:w-auto">
          <Select value={filterStatus} onValueChange={value => setFilterStatus(value as "all" | "paid" | "unpaid")}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee Table */}
      <Card className="shadow-sm rounded-lg border-gray-100">
        <CardContent className="p-0">
          {filteredFees.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No fee assignments found.</p>
              <p className="text-sm mt-2">Try adjusting your filters or assign a new fee.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fee Type</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden md:table-cell">Branch</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFees.map(fee => {
                      const userDisplay = fee.user ? `${fee.user.name} (${fee.user.email})` : `User ID: ${fee.user_id}`;
                      return (
                        <TableRow key={fee.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <TableCell className="px-4 py-3 font-medium text-gray-800">{userDisplay}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-700">{fee.fee_type}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-700">₹{fee.amount.toFixed(2)}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-700">
                            {new Date(fee.due_date).toLocaleDateString("en-GB")}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 hidden md:table-cell">{fee.branch_name || "N/A"}</TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge
                              variant={fee.is_paid ? "default" : "destructive"}
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                fee.is_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {fee.is_paid ? "Paid" : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Button
                              onClick={() => handleTogglePaidStatus(fee.id, fee.is_paid)}
                              className={`px-3 py-1 rounded text-white text-sm ${
                                fee.is_paid ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
                              }`}
                              size="sm"
                            >
                              {fee.is_paid ? "Mark Unpaid" : "Mark Paid"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-600">
                  Showing {filteredFees.length > 0 ? (currentPage - 1) * feesPerPage + 1 : 0} to {Math.min(currentPage * feesPerPage, filteredFees.length)} of {filteredFees.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === i + 1 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      variant="outline"
                      size="sm"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}