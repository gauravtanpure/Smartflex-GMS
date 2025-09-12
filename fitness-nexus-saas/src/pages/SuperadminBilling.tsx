// src/components/SuperadminBilling.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { DollarSign, XCircle, Banknote, Loader2, Info, FileWarning, ReceiptText, UserPlus, Users, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAs } from 'file-saver';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

interface Fee {
  id: number;
  user_id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  assigned_by_name: string;
  branch_name: string;
  user_name?: string;
  payment_type?: string;
}

interface FeeAnalytics {
  total_fees_assigned: number;
  total_fees_paid: number;
  total_outstanding_fees: number;
  paid_by_card: number;
  paid_by_cash: number;
  paid_by_upi: number;
}

interface User {
  id: number;
  name: string;
}

export default function SuperadminBilling() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [analytics, setAnalytics] = useState<FeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [paymentType, setPaymentType] = useState<string | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isAssigningFee, setIsAssigningFee] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  // State for new features
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All"); // "All", "Paid", "Unpaid"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // New Fee Assignment state
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [feeType, setFeeType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const { toast } = useToast();
  const token = localStorage.getItem("token");

  const fetchFees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No authentication token found. Please log in.");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFees(res.data);
    } catch (err: any) {
      console.error("Failed to load fees:", err);
      setError(`Failed to load fees: ${err.response?.data?.detail || err.message}`);
      toast({
        title: "Error",
        description: `Failed to load fees: ${err.response?.data?.detail || err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(res.data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      if (!token) throw new Error("No authentication token found.");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err: any) {
      console.error("Failed to load users:", err);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchAnalytics();
    fetchUsers();
  }, [token]);

  const handleMarkAsPaid = async () => {
    if (!selectedFee || !paymentType) return;
    setIsMarkingPaid(true);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/fees/${selectedFee.id}`, 
        { is_paid: true, payment_type: paymentType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Success",
        description: `Fee for ${selectedFee.user_name} marked as paid.`,
      });
      fetchFees();
      fetchAnalytics();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to mark fee as paid: ${err.response?.data?.detail || err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsMarkingPaid(false);
      setSelectedFee(null);
      setPaymentType(null);
    }
  };

  const handleGenerateReceipt = async (fee: Fee) => {
    try {
      const doc = new jsPDF();

      // Load logo from public folder (e.g., public/logo.png)
      const logoUrl = "./logo2.png"; // change to your actual filename
      const logoImg = await fetch(logoUrl)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            })
        );

      // Add Logo
      const imgWidth = 30;
      const imgHeight = 30;
      doc.addImage(logoImg, "PNG", 14, 10, imgWidth, imgHeight);

      // Header: SmartFlex Fitness
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SmartFlex Fitness", 50, 20);

      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.text("Official Payment Receipt", 50, 28);

      doc.line(14, 40, 200, 40);

      // Receipt Data
      const receiptData = [
        ["Receipt ID", `#${fee.id}`],
        ["Member Name", fee.user_name || "N/A"],
        ["Branch", fee.branch_name],
        ["Fee Type", fee.fee_type],
        ["Amount", `₹${fee.amount.toFixed(2)}`],
        ["Due Date", fee.due_date],
        ["Status", fee.is_paid ? "Paid" : "Unpaid"],
        ["Payment Type", fee.payment_type || "N/A"],
        ["Assigned By", fee.assigned_by_name],
        ["Issued Date", new Date().toLocaleDateString()],
      ];

      autoTable(doc, {
        startY: 50,
        head: [["Field", "Details"]],
        body: receiptData,
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [255, 102, 0], halign: "center" },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 60 },
          1: { cellWidth: 120 },
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setFont("poppins", "normal");
      doc.text("Thank you for choosing SmartFlex Fitness", 14, pageHeight - 25);
      doc.text("Stay Fit. Stay Strong.", 14, pageHeight - 20);
      doc.text(
        "This is a computer-generated receipt and does not require a signature.",
        14,
        pageHeight - 15
      );

      // Save
      doc.save(`SmartFlex_Receipt_${fee.id}.pdf`);

      toast({
        title: "Receipt Generated",
        description: "Official SmartFlex PDF receipt has been downloaded.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to generate receipt: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAssignFee = async () => {
    if (!assigneeId || !feeType || !amount || !dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all the required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAssigningFee(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid amount. Please enter a positive number.");
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/fees/`,
        {
          user_id: parseInt(assigneeId),
          fee_type: feeType,
          amount: parsedAmount,
          due_date: dueDate.toISOString().split('T')[0]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast({
        title: "Success",
        description: "Fee assigned successfully.",
      });
      
      setAssigneeId("");
      setFeeType("");
      setAmount("");
      setDueDate(undefined);
      
      fetchFees();
      fetchAnalytics();

    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to assign fee: ${err.response?.data?.detail || err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsAssigningFee(false);
    }
  };

  // Logic for search, filter, and pagination
  const filteredFees = fees.filter(fee => {
    if (filterStatus === "Paid") {
      return fee.is_paid;
    }
    if (filterStatus === "Unpaid") {
      return !fee.is_paid;
    }
    return true;
  });

  const filteredAndSearchedFees = filteredFees.filter(fee =>
    (fee.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.fee_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.assigned_by_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAndSearchedFees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFees = filteredAndSearchedFees.slice(startIndex, endIndex);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleFilterChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const hasFees = fees.length > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-boldd text-logoOrange">Billing Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage all user fees and view financial analytics.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-logoOrange hover:bg-logoOrange/90 transition-colors">
              <UserPlus className="w-4 h-4 mr-2" /> Assign New Fee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign New Fee</DialogTitle>
              <DialogDescription>
                Fill in the details to assign a new fee to a user.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">User</Label>
                <Select onValueChange={setAssigneeId} value={assigneeId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {users.map(user => (
                        <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="feeType" className="text-right">Fee Type</Label>
                <Input id="feeType" value={feeType} onChange={(e) => setFeeType(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal col-span-3",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAssignFee} disabled={isAssigningFee}>
                {isAssigningFee ? "Assigning..." : "Assign Fee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 shadow-sm rounded-lg border border-gray-200">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
              Total Fees Assigned
              <DollarSign className="w-4 h-4 text-gray-500" />
            </CardTitle>
            <CardContent>
              <div className="text-2xl font-bold mt-2">₹{analytics.total_fees_assigned.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm rounded-lg border border-gray-200">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
              Total Fees Paid
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardTitle>
            <CardContent>
              <div className="text-2xl font-bold mt-2">₹{analytics.total_fees_paid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm rounded-lg border border-gray-200">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
              Outstanding Fees
              <XCircle className="w-4 h-4 text-red-500" />
            </CardTitle>
            <CardContent>
              <div className="text-2xl font-bold mt-2">₹{analytics.total_outstanding_fees.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="p-4 shadow-sm rounded-lg border border-gray-200">
            <CardTitle className="text-sm font-medium flex items-center justify-between text-gray-600">
              Payment Breakdown
              <Banknote className="w-4 h-4 text-blue-500" />
            </CardTitle>
            <CardContent className="text-sm mt-2 space-y-1">
              <p>Card: <span className="font-bold">₹{analytics.paid_by_card.toFixed(2)}</span></p>
              <p>Cash: <span className="font-bold">₹{analytics.paid_by_cash.toFixed(2)}</span></p>
              <p>UPI: <span className="font-bold">₹{analytics.paid_by_upi.toFixed(2)}</span></p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="bg-white shadow-sm rounded-lg border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-boldd text-gray-800">
            All User Fees
          </CardTitle>
          <Users className="w-6 h-6 text-gray-500" />
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, branch, or fee type..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select onValueChange={handleFilterChange} value={filterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="mb-4" />
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-logoOrange animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-red-500">
              <FileWarning className="w-10 h-10 mb-4" />
              <p className="font-semibold text-lg">{error}</p>
              <Button onClick={fetchFees} className="mt-4">Try Again</Button>
            </div>
          ) : !hasFees || filteredAndSearchedFees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
              <Info className="w-10 h-10 mb-4" />
              <p className="text-lg font-semibold">No Fees Found</p>
              <p className="text-sm">No fee assignments match your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentFees.map((f) => (
                    <TableRow key={f.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium">{f.user_name}</TableCell>
                      <TableCell>{f.branch_name}</TableCell>
                      <TableCell>{f.fee_type}</TableCell>
                      <TableCell>₹{f.amount.toFixed(2)}</TableCell>
                      <TableCell>{f.due_date}</TableCell>
                      <TableCell>
                        <Badge variant={f.is_paid ? "default" : "destructive"}>
                          {f.is_paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell>{f.assigned_by_name}</TableCell>
                      <TableCell>{f.payment_type || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!f.is_paid && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedFee(f)}>Mark Paid</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Mark Fee as Paid</DialogTitle>
                                  <DialogDescription>
                                    Select the payment type to mark this fee as paid.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <span className="text-sm font-medium">Payment Type</span>
                                    <Select onValueChange={setPaymentType} required>
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select payment type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel>Payment Options</SelectLabel>
                                          <SelectItem value="Card">Card</SelectItem>
                                          <SelectItem value="Cash">Cash</SelectItem>
                                          <SelectItem value="UPI">UPI</SelectItem>
                                        </SelectGroup>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleMarkAsPaid} disabled={isMarkingPaid || !paymentType}>
                                    {isMarkingPaid ? "Saving..." : "Confirm Payment"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {f.is_paid && (
                            <Button size="sm" variant="outline" onClick={() => handleGenerateReceipt(f)}>
                              <ReceiptText className="w-4 h-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}