import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Apple, Clock, Target, Plus, Calendar } from "lucide-react";

export default function Diet() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Diet Sheet</h1>
          <p className="text-muted-foreground mt-1">Follow your personalized nutrition plan</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Empty State */}
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No diet plan assigned</h3>
            <p className="text-muted-foreground max-w-md">
              Your trainer hasn't assigned a diet plan yet. Contact your trainer to get a personalized nutrition plan.
            </p>
          </div>
          <Button variant="outline" className="mt-4">
            Contact Trainer
          </Button>
        </CardContent>
      </Card>

      {/* Nutrition Goals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-lg">2200</p>
            <p className="text-sm text-muted-foreground">Daily Calories</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Apple className="w-6 h-6 text-success" />
            </div>
            <p className="font-semibold text-lg">120g</p>
            <p className="text-sm text-muted-foreground">Protein Goal</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <p className="font-semibold text-lg">60g</p>
            <p className="text-sm text-muted-foreground">Fat Limit</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <p className="font-semibold text-lg">250g</p>
            <p className="text-sm text-muted-foreground">Carbs Goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Plan Template */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <span>Breakfast</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Start your day with a nutritious meal
            </p>
            <Badge variant="outline" className="mb-2">7:00 - 9:00 AM</Badge>
            <p className="text-xs text-muted-foreground">
              Target: 400-500 calories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Apple className="w-4 h-4 text-green-600" />
              </div>
              <span>Lunch</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Balanced meal with protein and vegetables
            </p>
            <Badge variant="outline" className="mb-2">12:00 - 2:00 PM</Badge>
            <p className="text-xs text-muted-foreground">
              Target: 600-700 calories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <span>Dinner</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Light but nutritious evening meal
            </p>
            <Badge variant="outline" className="mb-2">7:00 - 9:00 PM</Badge>
            <p className="text-xs text-muted-foreground">
              Target: 500-600 calories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Meal Planner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Weekly Meal Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Your weekly meal plan will appear here once assigned by your trainer.
            </p>
            <Button variant="outline" className="mt-4">
              Request Meal Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}