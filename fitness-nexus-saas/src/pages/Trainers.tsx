import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Import useQuery, useMutation, useQueryClient
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, // Import CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Calendar, Star, Clock, Info } from "lucide-react"; // Import Clock, Info
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Import Dialog components
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { format, parseISO } from "date-fns"; // Import date-fns for date formatting
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

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
  description?: string; // Add description for trainer profile
}

interface SessionSchedule {
  id: number;
  trainer_id: number;
  session_name: string;
  session_date: string | null; // Changed to allow null
  start_time: string | null; // Changed to allow null
  end_time: string | null; // Changed to allow null
  branch_name: string | null; // Changed to allow null
  max_capacity: number | null; // Changed to allow null
  description: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Trainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerForProfile, setSelectedTrainerForProfile] = useState<Trainer | null>(null);
  const [selectedTrainerForBooking, setSelectedTrainerForBooking] = useState<Trainer | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<SessionSchedule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = parseInt(localStorage.getItem("user_id") || "0"); // Get current user ID for booking

  useEffect(() => {
    const fetchTrainers = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/trainers/`, {
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

  // Fetch detailed trainer profile when selectedTrainerForProfile is set
  const { data: trainerProfile, isLoading: isLoadingProfile, error: profileError } = useQuery<Trainer>({
    queryKey: ["trainerProfile", selectedTrainerForProfile?.id],
    queryFn: async () => {
      if (!selectedTrainerForProfile?.id) throw new Error("Trainer ID is missing.");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/trainers/${selectedTrainerForProfile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch trainer profile");
      }
      return response.json();
    },
    enabled: !!selectedTrainerForProfile?.id, // Only run the query if a trainer is selected
  });

  // Fetch sessions for the selected trainer when selectedTrainerForBooking is set
  const { data: sessionsForBooking, isLoading: isLoadingSessionsForBooking, error: sessionsForBookingError } = useQuery<SessionSchedule[]>({
    queryKey: ["trainerSessionsForBooking", selectedTrainerForBooking?.id],
    queryFn: async () => {
      if (!selectedTrainerForBooking?.id) return [];
      const token = localStorage.getItem("token");
      // Use the new public endpoint for sessions
      const response = await fetch(`${API_BASE_URL}/trainers/public-sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch sessions");
      }
      const allSessions: SessionSchedule[] = await response.json();
      // Filter sessions by the current trainer's ID
      return allSessions.filter(session => session.trainer_id === selectedTrainerForBooking.id);
    },
    enabled: !!selectedTrainerForBooking?.id,
  });

  // Mutation for booking a session (marking attendance as 'present')
  const bookSessionMutation = useMutation({
    mutationFn: async (session: SessionSchedule) => {
      const token = localStorage.getItem("token");
      const payload = {
        session_id: session.id,
        user_id: currentUserId,
        status: "present",
        attendance_date: format(new Date(), "yyyy-MM-dd"), // Mark attendance for today
      };

      // Check if attendance already exists for this user, session, and date
      const existingAttendanceResponse = await fetch(
        `${API_BASE_URL}/trainers/sessions/${session.id}/attendance?user_id=${currentUserId}&attendance_date=${payload.attendance_date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let existingAttendanceRecord = null;
      if (existingAttendanceResponse.ok) {
        const data = await existingAttendanceResponse.json();
        existingAttendanceRecord = data.find((att: any) => att.user_id === currentUserId && att.attendance_date === payload.attendance_date);
      }

      let response;
      if (existingAttendanceRecord) {
        // If record exists, update it (e.g., from absent to present)
        response = await fetch(`${API_BASE_URL}/trainers/sessions/attendance/${existingAttendanceRecord.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        // If no record, create new
        response = await fetch(`${API_BASE_URL}/trainers/sessions/${session.id}/attendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to book session");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trainerSessionsForBooking"] }); // Invalidate to reflect updated capacity if applicable
      setBookingConfirmation(variables); // Show confirmation dialog with session details
      toast({ title: "Success", description: `Session "${variables.session_name}" booked successfully!` });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to book session: ${error.message}`,
        variant: "destructive",
      });
    },
  });


  const handleViewProfile = (trainer: Trainer) => {
    setSelectedTrainerForProfile(trainer);
  };

  const handleBookSession = (trainer: Trainer) => {
    setSelectedTrainerForBooking(trainer);
  };

  const upcomingSessions = sessionsForBooking?.filter(session =>
    session.session_date && parseISO(session.session_date) >= new Date() // Added null check for session_date
  ).sort((a, b) => {
    if (!a.session_date || !b.session_date) return 0; // Handle null dates for sorting
    return parseISO(a.session_date).getTime() - parseISO(b.session_date).getTime();
  });


  return (
    <div className="space-y-6" font-poppins>
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
                  <span>Availability: {trainer.availability}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button className="w-full" size="sm" onClick={() => handleBookSession(trainer)}>
                  Book Session
                </Button>
                <Button variant="outline" className="w-full" size="sm" onClick={() => handleViewProfile(trainer)}>
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

      {/* Trainer Profile Dialog */}
      {selectedTrainerForProfile && (
        <Dialog open={!!selectedTrainerForProfile} onOpenChange={() => setSelectedTrainerForProfile(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Trainer Profile</DialogTitle>
              <DialogDescription>Details about {trainerProfile?.name}</DialogDescription>
            </DialogHeader>
            {isLoadingProfile ? (
              <p>Loading profile...</p>
            ) : profileError ? (
              <p className="text-red-500">Error: {profileError.message}</p>
            ) : trainerProfile ? (
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{trainerProfile.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {trainerProfile.experience} years experience {trainerProfile.branch_name && ` • Branch: ${trainerProfile.branch_name}`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {trainerProfile.specialization.map((spec, idx) => (
                        <Badge key={idx} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{trainerProfile.rating} / 5.0 Rating</span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-md font-semibold">Contact:</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{trainerProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{trainerProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Availability: {trainerProfile.availability}</span>
                  </div>
                </div>
                {trainerProfile.description && (
                  <div className="space-y-2">
                    <h4 className="text-md font-semibold">About:</h4>
                    <p className="text-sm text-muted-foreground">{trainerProfile.description}</p>
                  </div>
                )}
              </div>
            ) : null}
            <DialogFooter>
              <Button onClick={() => setSelectedTrainerForProfile(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Book Session Dialog */}
      {selectedTrainerForBooking && (
        <Dialog open={!!selectedTrainerForBooking} onOpenChange={() => setSelectedTrainerForBooking(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Book Session with {selectedTrainerForBooking.name}</DialogTitle>
              <DialogDescription>Upcoming sessions available from this trainer.</DialogDescription>
            </DialogHeader>
            {isLoadingSessionsForBooking ? (
              <p>Loading sessions...</p>
            ) : sessionsForBookingError ? (
              <p className="text-red-500">Error: {sessionsForBookingError.message}</p>
            ) : upcomingSessions && upcomingSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No upcoming sessions available from this trainer.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[400px] overflow-y-auto">
                {upcomingSessions?.map((session) => (
                  <Card key={session.id} className="p-4 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold">{session.session_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      {session.session_date ? format(parseISO(session.session_date), "PPP") : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {session.start_time && session.end_time ? `${session.start_time.substring(0, 5)} - ${session.end_time.substring(0, 5)}` : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Info className="w-4 h-4 mr-1" />
                      Capacity: {session.max_capacity !== null ? session.max_capacity : "N/A"}
                    </p>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-2">{session.description}</p>
                    )}
                    <Button
                      className="w-full mt-4"
                      onClick={() => bookSessionMutation.mutate(session)}
                      disabled={bookSessionMutation.isPending}
                    >
                      {bookSessionMutation.isPending ? "Booking..." : "Book Now"}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setSelectedTrainerForBooking(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Booking Confirmation Dialog */}
      {bookingConfirmation && (
        <Dialog open={!!bookingConfirmation} onOpenChange={() => setBookingConfirmation(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Session Booked!</DialogTitle>
              <DialogDescription>
                You have successfully booked the following session:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <p><strong>Session:</strong> {bookingConfirmation.session_name}</p>
              <p><strong>Date:</strong> {bookingConfirmation.session_date ? format(parseISO(bookingConfirmation.session_date), "PPP") : "N/A"}</p>
              <p><strong>Time:</strong> {bookingConfirmation.start_time && bookingConfirmation.end_time ? `${bookingConfirmation.start_time.substring(0, 5)} - ${bookingConfirmation.end_time.substring(0, 5)}` : "N/A"}</p>
              <p><strong>Trainer:</strong> {selectedTrainerForBooking?.name}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setBookingConfirmation(null)}>
                Got It!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
