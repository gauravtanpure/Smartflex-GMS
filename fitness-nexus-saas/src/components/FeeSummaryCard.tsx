import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

interface FeeSummaryCardProps {
  title: string;
  amount: number;
  type: "paid" | "unpaid";
  className?: string;
}

export function FeeSummaryCard({ title, amount, type, className }: FeeSummaryCardProps) {
  const isPaid = type === "paid";
  
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-lg",
      isPaid ? "bg-primary" : "bg-accent",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Background Icon */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-20">
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
            isPaid ? "bg-white/20" : "bg-black/20"
          )}>
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className={cn(
            "text-sm font-medium mb-2",
            isPaid ? "text-primary-foreground/80" : "text-accent-foreground/80"
          )}>
            {title}
          </h3>
          <div className="flex items-baseline space-x-1">
            <IndianRupee className={cn(
              "w-5 h-5",
              isPaid ? "text-primary-foreground" : "text-accent-foreground"
            )} />
            <span className={cn(
              "text-2xl sm:text-3xl font-boldd",
              isPaid ? "text-primary-foreground" : "text-accent-foreground"
            )}>
              {amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 rounded-full opacity-10">
          <div className={cn(
            "w-full h-full rounded-full",
            isPaid ? "bg-white" : "bg-black"
          )} />
        </div>
      </CardContent>
    </Card>
  );
}