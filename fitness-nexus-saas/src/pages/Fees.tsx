import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, AlertCircle, CheckCircle, IndianRupee } from "lucide-react";
import { FeeSummaryCard } from "@/components/FeeSummaryCard";

const feeHistory = [
  {
    id: 1,
    month: "January 2024",
    amount: 1000,
    dueDate: "2024-01-31",
    status: "unpaid",
    description: "Monthly Membership Fee"
  },
  {
    id: 2,
    month: "December 2023",
    amount: 1000,
    dueDate: "2023-12-31",
    status: "paid",
    paidDate: "2023-12-28",
    description: "Monthly Membership Fee"
  },
  {
    id: 3,
    month: "November 2023",
    amount: 1000,
    dueDate: "2023-11-30",
    status: "paid",
    paidDate: "2023-11-25",
    description: "Monthly Membership Fee"
  },
];

export default function Fees() {
  const totalUnpaid = feeHistory
    .filter(fee => fee.status === "unpaid")
    .reduce((sum, fee) => sum + fee.amount, 0);
    
  const totalPaid = feeHistory
    .filter(fee => fee.status === "paid")
    .reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Fees</h1>
          <p className="text-muted-foreground mt-1">Manage your membership fees and payment history</p>
        </div>
        {totalUnpaid > 0 && (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>₹{totalUnpaid.toLocaleString()} Due</span>
          </Badge>
        )}
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeeSummaryCard
          title="Paid"
          amount={totalPaid}
          type="paid"
        />
        <FeeSummaryCard
          title="Unpaid"
          amount={totalUnpaid}
          type="unpaid"
        />
      </div>

      {/* Outstanding Payments */}
      {totalUnpaid > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span>Outstanding Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feeHistory
                .filter(fee => fee.status === "unpaid")
                .map(fee => (
                  <div key={fee.id} className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{fee.description}</p>
                        <p className="text-sm text-muted-foreground">{fee.month}</p>
                        <div className="flex items-center space-x-1 text-sm text-destructive mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(fee.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{fee.amount.toLocaleString()}</p>
                        <Badge variant="destructive">Unpaid</Badge>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary-hover">
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span>Payment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeHistory.map(fee => (
              <div key={fee.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    fee.status === "paid" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {fee.status === "paid" ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{fee.description}</p>
                    <p className="text-sm text-muted-foreground">{fee.month}</p>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {fee.status === "paid" 
                          ? `Paid: ${new Date(fee.paidDate!).toLocaleDateString()}`
                          : `Due: ${new Date(fee.dueDate).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{fee.amount.toLocaleString()}</p>
                    <Badge variant={fee.status === "paid" ? "default" : "destructive"}>
                      {fee.status === "paid" ? "Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Set Up Auto-Pay</h3>
                <p className="text-sm text-muted-foreground">Never miss a payment again</p>
              </div>
              <Button variant="outline" size="sm">Setup</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Payment Methods</h3>
                <p className="text-sm text-muted-foreground">Manage your payment options</p>
              </div>
              <Button variant="outline" size="sm">Manage</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}