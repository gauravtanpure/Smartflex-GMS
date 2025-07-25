import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Calendar, Star } from "lucide-react";

interface Trainer {
  id: number;
  name: string;
  specialization: string[];
  rating: number;
  experience: number;
  phone: string;
  email: string;
  availability: string;
  branch_name?: string;
}

export default function Trainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  useEffect(() => {
    const fetchTrainers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/trainers/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data);
      } else {
        console.error("Failed to fetch trainers");
      }
    };

    fetchTrainers();
  }, []);

  const avgRating = trainers.length
    ? (trainers.reduce((acc, t) => acc + t.rating, 0) / trainers.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trainers</h1>
          <p className="text-muted-foreground mt-1">Meet our certified fitness professionals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{trainers.length} Active Trainers</span>
          </Badge>
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{trainer.name}</CardTitle>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {trainer.specialization.map((spec, idx) => (
                      <Badge key={idx} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{trainer.rating}</span>
                <span className="text-sm text-muted-foreground">• {trainer.experience} years</span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{trainer.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{trainer.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{trainer.availability}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button className="w-full" size="sm">
                  Book Session
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <p className="font-semibold text-lg">{trainers.length}</p>
            <p className="text-sm text-muted-foreground">Active Trainers</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-success" />
            </div>
            <p className="font-semibold text-lg">{avgRating}</p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <p className="font-semibold text-lg">24</p>
            <p className="text-sm text-muted-foreground">Sessions This Week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <p className="font-semibold text-lg">45</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
