// src/pages/ApproveTrainerRevenue.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

interface Trainer {
  id: number;
  name: string;
  branch_name: string;
  revenue_config: string;
  is_approved_by_superadmin: boolean;
}

const ApproveTrainerRevenue = () => {
  const [pendingTrainers, setPendingTrainers] = useState<Trainer[]>([]);
  const { toast } = useToast();

  const fetchPendingTrainers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/trainers/pending-revenue-approvals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingTrainers(data);
      } else {
        const errorData = await res.json();
        toast({
          title: "Failed to fetch trainers",
          description: errorData.detail,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Server error", variant: "destructive" });
    }
  };

  const handleApprove = async (trainerId: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/trainers/revenue/${trainerId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Approval Successful", description: "Trainer revenue config has been approved.", variant: "success" });
        fetchPendingTrainers(); // Refresh the list
      } else {
        const errorData = await res.json();
        toast({
          title: "Approval Failed",
          description: errorData.detail,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Server error", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPendingTrainers();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-boldd text-logoOrange">Approve Trainer Revenue</h1>
      {pendingTrainers.length === 0 ? (
        <p>No trainers are waiting for revenue configuration approval.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingTrainers.map((trainer) => (
            <Card key={trainer.id}>
              <CardHeader>
                <CardTitle className="text-logoOrange">{trainer.name}</CardTitle>
                <p className="text-sm text-muted-foreground">Branch: {trainer.branch_name}</p>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Proposed Revenue: {trainer.revenue_config}</p>
                <Button className="mt-4 w-full" onClick={() => handleApprove(trainer.id)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Approve
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApproveTrainerRevenue;