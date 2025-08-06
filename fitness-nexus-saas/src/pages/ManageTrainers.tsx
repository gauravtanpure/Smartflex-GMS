import { useEffect, useState } from "react";
import Select from "react-select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Star, Phone, Mail, Clock, Trash2, Pencil } from "lucide-react";

interface Trainer {
  id: number;
  name: string;
  specialization: string[];
  rating: number;
  experience: number;
  phone: string;
  email: string;
  password?: string;
  availability?: string;
  branch_name?: string;
}

export default function ManageTrainers() {
  const specializationOptions = [
    { value: "Cardio", label: "Cardio" },
    { value: "Strength", label: "Strength" },
    { value: "Yoga", label: "Yoga" },
    { value: "Zumba", label: "Zumba" },
  ];
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTrainerId, setEditTrainerId] = useState<number | null>(null);
  const [newTrainer, setNewTrainer] = useState<Trainer>({
    id: 0,
    name: "",
    specialization: [],
    rating: 0.0,
    experience: 0,
    phone: "",
    email: "",
    password: "",
    availability: "",
    branch_name: localStorage.getItem("branch") || "",
  });

  const fetchTrainers = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/trainers/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data);
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

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleSaveTrainer = async () => {
    if (!newTrainer.name || !newTrainer.email || !newTrainer.phone || newTrainer.specialization.length === 0 || !newTrainer.password) {
      toast({ title: "Validation", description: "All fields are required", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("token");
    const url = editTrainerId ? `http://localhost:8000/trainers/${editTrainerId}` : `http://localhost:8000/trainers/add-trainer`;
    const method = editTrainerId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newTrainer),
    });

    if (res.ok) {
      toast({ title: `Trainer ${editTrainerId ? "Updated" : "Added"}`, variant: "success" });
      fetchTrainers();
      setDialogOpen(false);
      setEditTrainerId(null);
      setNewTrainer({
        id: 0,
        name: "",
        specialization: [],
        rating: 0.0,
        experience: 0,
        phone: "",
        email: "",
        password: "",
        availability: "",
        branch_name: localStorage.getItem("branch") || "",
      });
    } else {
      const errorData = await res.json();
      toast({ title: "Failed", description: errorData.detail, variant: "destructive" });
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setNewTrainer({ ...trainer, password: "" });
    setEditTrainerId(trainer.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:8000/trainers/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast({ title: "Trainer Deleted", variant: "success" });
      fetchTrainers();
    } else {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 p-4" font-poppins>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: "#6b7e86" }}>Manage Trainers</h1>
        <Button onClick={() => setDialogOpen(true)}>Add Trainer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="relative">
            <CardHeader>
              <CardTitle>{trainer.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{trainer.specialization.join(", ")}</p>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <div><Star className="inline w-4 h-4 text-yellow-500 mr-1" />{trainer.rating.toFixed(1)} - {trainer.experience} yrs</div>
              <div><Phone className="inline w-4 h-4 mr-1" />{trainer.phone}</div>
              <div><Mail className="inline w-4 h-4 mr-1" />{trainer.email}</div>
              {trainer.availability && <div><Clock className="inline w-4 h-4 mr-1" />{trainer.availability}</div>}
              {trainer.branch_name && <div>Branch: {trainer.branch_name}</div>}
            </CardContent>
            <div className="absolute top-2 right-2 flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => handleEdit(trainer)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="destructive" onClick={() => handleDelete(trainer.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editTrainerId ? "Edit Trainer" : "Add New Trainer"}
            </DialogTitle>
            <DialogDescription>
              Fill in the trainer's information to {editTrainerId ? "update their profile" : "add them to the system"}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter trainer name"
                value={newTrainer.name}
                onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Select
                isMulti
                options={specializationOptions}
                value={specializationOptions.filter((opt) =>
                  newTrainer.specialization.includes(opt.value)
                )}
                onChange={(selected) =>
                  setNewTrainer({
                    ...newTrainer,
                    specialization: selected.map((s) => s.value),
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="rating">Rating</Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                placeholder="e.g., 4.5"
                value={newTrainer.rating}
                onChange={(e) =>
                  setNewTrainer({ ...newTrainer, rating: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="experience">Experience (years)</Label>
              <Input
                id="experience"
                type="number"
                placeholder="e.g., 2"
                value={newTrainer.experience}
                onChange={(e) =>
                  setNewTrainer({ ...newTrainer, experience: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="e.g., 9876543210"
                value={newTrainer.phone}
                onChange={(e) => setNewTrainer({ ...newTrainer, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., trainer@example.com"
                value={newTrainer.email}
                onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={editTrainerId ? "Leave blank to keep current" : "Enter password"}
                value={newTrainer.password}
                onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="availability">Availability</Label>
              <Textarea
                id="availability"
                placeholder="e.g., Mon-Fri 10AM to 6PM"
                value={newTrainer.availability}
                onChange={(e) => setNewTrainer({ ...newTrainer, availability: e.target.value })}
              />
            </div>

            {localStorage.getItem("role") === "superadmin" && (
              <div className="sm:col-span-2">
                <Label htmlFor="branch">Branch Name</Label>
                <Input
                  id="branch"
                  placeholder="e.g., Pune Branch"
                  value={newTrainer.branch_name}
                  onChange={(e) =>
                    setNewTrainer({ ...newTrainer, branch_name: e.target.value })
                  }
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTrainer}>
              {editTrainerId ? "Update Trainer" : "Add Trainer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
