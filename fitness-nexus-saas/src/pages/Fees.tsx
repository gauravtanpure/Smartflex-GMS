import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Wallet, User, Banknote, Building, Loader2, Info, XCircle, FileWarning } from "lucide-react";
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

interface Fee {
  id: number;
  fee_type: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  assigned_by_name: string;
  branch_name: string;
}

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const token = localStorage.getItem("token");

  const fetchMyFees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }
      const res = await axios.get("http://localhost:8000/fees/my-fees", {
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

  useEffect(() => {
    fetchMyFees();
  }, [token]);

  // Calculate totals
  const totalOutstandingFees = fees.filter(f => !f.is_paid).reduce((sum, f) => sum + f.amount, 0);
  const totalPaidFees = fees.filter(f => f.is_paid).reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-boldd text-logoOrange">My Fees</h1>
          <p className="text-lg text-muted-foreground">Manage your gym payments and view your financial history.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <Card className="p-3 shadow-sm rounded-lg flex items-center space-x-2 bg-white border-yellow-200">
            <Wallet className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-700">Outstanding: <span className="text-lg font-boldd text-yellow-700">₹{totalOutstandingFees.toLocaleString()}</span></span>
          </Card>
          <Card className="p-3 shadow-sm rounded-lg flex items-center space-x-2 bg-white border-green-200">
            <Banknote className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Total Paid: <span className="text-lg font-boldd text-green-700">₹{totalPaidFees.toLocaleString()}</span></span>
          </Card>
        </div>
      </div>

      {/* Main Fees Card */}
      <Card className="rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-2xl font-boldd flex items-center space-x-3" style={{ color: "#6b7e86" }}>
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <span className="text-logoOrange">Fee Details</span>
          </CardTitle>
          <CardDescription>
            A comprehensive list of all your assigned fees.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0"> {/* Remove padding from CardContent */}
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500 mx-auto" />
              <p className="mt-4 text-gray-600">Loading fees, please wait...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <FileWarning className="h-10 w-10 mx-auto mb-4" />
              <p className="font-semibold text-lg">Error loading fees:</p>
              <p className="mt-2 text-sm">{error}</p>
              <Button onClick={fetchMyFees} className="mt-4">Retry Loading</Button>
            </div>
          ) : fees.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <Info className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <p className="font-semibold text-lg">No fees assigned to you yet!</p>
              <p className="mt-2 text-sm">Your financial records appear clear. Check back later or contact support if you believe this is an error.</p>
            </div>
          ) : (
            <div className="overflow-x-auto"> {/* Ensures table is scrollable on small screens */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tl-lg">Type</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Due Date</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned By</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider rounded-tr-lg">Branch</TableHead>
                    <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</TableHead> {/* Added Actions column */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((f, index) => (
                    <TableRow
                      key={f.id}
                      className={`
                        border-b last:border-b-0
                        transition-all duration-300 ease-in-out
                        hover:bg-blue-50/50 hover:shadow-md
                        ${f.is_paid ? 'bg-green-50/30' : 'bg-red-50/30'}
                        animate-in fade-in slide-in-from-bottom-2
                        `} // Dynamic background and animation
                      style={{ animationDelay: `${index * 50}ms` }} // Staggered animation
                    >
                      <TableCell className="py-3 px-4 font-medium text-gray-800 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-500" /> {f.fee_type}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-lg font-semibold text-gray-900">₹{f.amount.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                          {new Date(f.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge variant={f.is_paid ? "success" : "destructive"} className="text-xs font-semibold px-2 py-1">
                          {f.is_paid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600 flex items-center">
                        <User className="w-4 h-4 mr-1 text-gray-500" /> {f.assigned_by_name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-sm text-gray-600 flex items-center">
                        <Building className="w-4 h-4 mr-1 text-gray-500" /> {f.branch_name}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hover:bg-blue-100 transition-colors">
                              <Info className="w-4 h-4 mr-1" /> View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] rounded-lg shadow-xl animate-in zoom-in-95 ease-out duration-300">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-boldd text-gray-800">{f.fee_type}</DialogTitle>
                              <DialogDescription className="text-sm text-gray-500">
                                Detailed information about this fee record.
                              </DialogDescription>
                            </DialogHeader>
                            <Separator className="my-4" />
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">Amount:</span>
                                <span className="col-span-2 text-lg font-boldd text-gray-900">₹{f.amount.toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">Due Date:</span>
                                <span className="col-span-2 text-gray-800">{new Date(f.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">Status:</span>
                                <span className="col-span-2">
                                  <Badge variant={f.is_paid ? "success" : "destructive"}>
                                    {f.is_paid ? "Paid" : "Unpaid"}
                                  </Badge>
                                </span>
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">Assigned By:</span>
                                <span className="col-span-2 text-gray-800">{f.assigned_by_name}</span>
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                <span className="text-sm font-medium text-gray-600">Branch:</span>
                                <span className="col-span-2 text-gray-800">{f.branch_name}</span>
                              </div>
                            </div>
                            <DialogFooter className="mt-4">
                              {!f.is_paid && (
                                <Button className="bg-logoOrange hover:bg-logoOrange/90 transition-colors">
                                  <Wallet className="w-4 h-4 mr-2" /> Make Payment
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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