import { FeeSummaryCard } from "@/components/FeeSummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock, Target } from "lucide-react";
import { useEffect, useState } from "react";


export default function Dashboard() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Hi, Welcome back
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
          {username}
        </h2>

      </div>

      {/* Fee Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        <FeeSummaryCard
          title="Paid"
          amount={0}
          type="paid"
        />
        <FeeSummaryCard
          title="Unpaid"
          amount={1000}
          type="unpaid"
        />
      </div>

      {/* Attendance Section */}
      <div className="space-y-4">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground">Attendance</h3>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Attendance Graph</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Mock attendance data */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Week</span>
                  <span className="text-muted-foreground">4/7 days</span>
                </div>
                <Progress value={57} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Month</span>
                  <span className="text-muted-foreground">18/30 days</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full mx-auto mb-2">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Total Days</p>
                  <p className="font-semibold">30</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-success/10 rounded-full mx-auto mb-2">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-xs text-muted-foreground">Present</p>
                  <p className="font-semibold text-success">18</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-accent/10 rounded-full mx-auto mb-2">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-semibold">25</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workout Goal</p>
                <p className="text-lg font-semibold">75% Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-lg font-semibold">4 Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-lg font-semibold">24.5 hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}