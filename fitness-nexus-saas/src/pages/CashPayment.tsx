// src/pages/CashPayment.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Banknote, Loader2, Info, FileWarning, Search, ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
}

export default function CashPayment() {
  const [unpaidFees, setUnpaidFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { toast } = useToast();
  const token = localStorage.getItem("token");

  const fetchUnpaidFees = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No authentication token found. Please log in.");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Filter for unpaid fees only
      setUnpaidFees(res.data.filter((fee: Fee) => !fee.is_paid));
    } catch (err: any) {
      const errorMessage = `Failed to load unpaid fees: ${err.response?.data?.detail || err.message}`;
      console.error(errorMessage, err);
      setError(errorMessage);
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
    fetchUnpaidFees();
  }, [token]);

  const generateAndPrintReceipt = async (fee: Fee) => {
    try {
      const doc = new jsPDF();
      const logoUrl = "/logo2.png";
      const logoImg = await fetch(logoUrl).then(res => res.blob()).then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }));

      doc.addImage(logoImg, "PNG", 14, 10, 30, 30);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SmartFlex Fitness", 50, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "italic");
      doc.text("Official Payment Receipt", 50, 28);
      doc.line(14, 40, 200, 40);

      const receiptData = [
        ["Receipt ID", `#${fee.id}`],
        ["Member Name", fee.user_name || "N/A"],
        ["Branch", fee.branch_name],
        ["Fee Type", fee.fee_type],
        ["Amount", `₹${fee.amount.toFixed(2)}`],
        ["Payment Method", "Cash"],
        ["Issued Date", new Date().toLocaleDateString()],
      ];

      autoTable(doc, {
        startY: 50,
        head: [["Field", "Details"]],
        body: receiptData,
        styles: { fontSize: 11, cellPadding: 4 },
        headStyles: { fillColor: [255, 102, 0] },
        columnStyles: { 0: { fontStyle: "bold" } },
      });

      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.text("Thank you for your payment.", 14, pageHeight - 20);
      doc.text("This is a computer-generated receipt.", 14, pageHeight - 15);

      // Trigger print dialog in a new window
      doc.autoPrint();
      doc.output("dataurlnewwindow");

      toast({
        title: "Receipt Ready",
        description: "Receipt has been generated and is ready for printing.",
      });
    } catch (err: any) {
      toast({
        title: "Receipt Error",
        description: `Failed to generate receipt: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAcceptCashPayment = async () => {
    if (!selectedFee) return;
    setIsProcessing(true);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/fees/${selectedFee.id}`, 
        { is_paid: true, payment_type: "Cash" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({
        title: "Payment Successful",
        description: `Cash payment for ${selectedFee.user_name} has been recorded.`,
      });

      // Generate and print receipt immediately after successful API call
      await generateAndPrintReceipt(selectedFee);

      fetchUnpaidFees(); // Refresh the list
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: `Failed to record payment: ${err.response?.data?.detail || err.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setSelectedFee(null); // Close dialog by resetting the selected fee
    }
  };
  
  const filteredFees = unpaidFees.filter(fee =>
    fee.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.fee_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFees = filteredFees.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-poppins">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-boldd text-logoOrange">Cash Payment Terminal</h1>
          <p className="text-lg text-muted-foreground">
            Process cash payments for unpaid user fees.
          </p>
        </div>
      </div>
      
      <Card className="bg-white shadow-sm rounded-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-boldd text-gray-800">
            Pending Unpaid Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, branch, or fee type..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Separator className="mb-4" />
          {loading ? (
            <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 text-logoOrange animate-spin" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500"><FileWarning className="w-10 h-10 mb-4" /><p className="font-semibold text-lg">{error}</p></div>
          ) : filteredFees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500"><Info className="w-10 h-10 mb-4" /><p className="text-lg font-semibold">No Unpaid Fees</p><p>All fees are settled, or none match your search.</p></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Branch</TableHead><TableHead>Fee Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {currentFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.user_name}</TableCell>
                        <TableCell>{fee.branch_name}</TableCell>
                        <TableCell>{fee.fee_type}</TableCell>
                        <TableCell>₹{fee.amount.toFixed(2)}</TableCell>
                        <TableCell>{fee.due_date}</TableCell>
                        <TableCell>
                          <Dialog open={selectedFee?.id === fee.id} onOpenChange={(isOpen) => !isOpen && setSelectedFee(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedFee(fee)}>
                                <Banknote className="w-4 h-4 mr-2" />
                                Accept Cash
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Cash Payment</DialogTitle>
                                <DialogDescription>
                                  Please confirm you have received the cash payment from the user before proceeding. This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-2">
                                <p><strong>User:</strong> {selectedFee?.user_name}</p>
                                <p><strong>Fee Type:</strong> {selectedFee?.fee_type}</p>
                                <p><strong>Amount:</strong> ₹{selectedFee?.amount.toFixed(2)}</p>
                              </div>
                              <DialogFooter>
                                <Button variant="ghost" onClick={() => setSelectedFee(null)}>Cancel</Button>
                                <Button onClick={handleAcceptCashPayment} disabled={isProcessing}>
                                  {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Processing...</> : "Confirm & Print Receipt"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button>
                <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}>Next <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}