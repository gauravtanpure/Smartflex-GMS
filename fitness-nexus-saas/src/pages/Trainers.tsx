import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, Calendar, Star, Clock, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  description?: string;
}

interface SessionSchedule {
  id: number;
  trainer_id: number;
  session_name: string;
  session_date: string | null;
  start_time: string | null;
  end_time: string | null;
  branch_name: string | null;
  max_capacity: number | null;
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
  const currentUserId = parseInt(localStorage.getItem("user_id") || "0");

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
    enabled: !!selectedTrainerForProfile?.id,
  });

  const { data: sessionsForBooking, isLoading: isLoadingSessionsForBooking, error: sessionsForBookingError } = useQuery<SessionSchedule[]>({
    queryKey: ["trainerSessionsForBooking", selectedTrainerForBooking?.id],
    queryFn: async () => {
      if (!selectedTrainerForBooking?.id) return [];
      const token = localStorage.getItem("token");
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
      return allSessions.filter(session => session.trainer_id === selectedTrainerForBooking.id);
    },
    enabled: !!selectedTrainerForBooking?.id,
  });

  const bookSessionMutation = useMutation({
    mutationFn: async (session: SessionSchedule) => {
      const token = localStorage.getItem("token");
      const payload = {
        session_id: session.id,
        user_id: currentUserId,
        status: "present",
        attendance_date: format(new Date(), "yyyy-MM-dd"),
      };

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
        response = await fetch(`${API_BASE_URL}/trainers/sessions/attendance/${existingAttendanceRecord.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
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
      queryClient.invalidateQueries({ queryKey: ["trainerSessionsForBooking"] });
      setBookingConfirmation(variables);
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
    session.session_date && parseISO(session.session_date) >= new Date()
  ).sort((a, b) => {
    if (!a.session_date || !b.session_date) return 0;
    return parseISO(a.session_date).getTime() - parseISO(b.session_date).getTime();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-boldd text-logoOrange mb-2">Our Expert Trainers</h1>
          <p className="text-lg text-muted-foreground">Discover the best fitness professionals to help you achieve your goals.</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Badge variant="outline" className="px-4 py-2 text-md font-semibold flex items-center space-x-2 bg-white shadow-sm border-gray-200">
            <Users className="w-4 h-4 text-primary" />
            <span>{trainers.length} Active Trainers</span>
          </Badge>
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="relative overflow-hidden rounded-xl shadow-md border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-logoOrange to-orange-400"></div>
            <CardHeader className="pb-4 pt-6">
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-md flex-shrink-0">
                  <Users className="w-10 h-10 text-primary-foreground text-logoOrange" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl font-boldd text-gray-900">{trainer.name}</CardTitle>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {trainer.specialization.map((spec, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">{spec}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              {/* Rating & Experience */}
              <div className="flex items-center space-x-2 text-gray-700">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-lg">{trainer.rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">• {trainer.experience} years experience</span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>{trainer.phone}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>{trainer.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span>Availability: {trainer.availability}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                <Button
                  className="w-full py-2 px-4 rounded-lg text-lg font-semibold bg-logoOrange hover:bg-orange-600 transition-colors shadow-md"
                  onClick={() => handleBookSession(trainer)}
                >
                  Book Session
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-2 px-4 rounded-lg text-lg font-semibold border-2 border-gray-200 text-gray-700 hover:bg-logoOrange hover:text-white transition-colors"
                  onClick={() => handleViewProfile(trainer)}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <Card className="rounded-xl shadow-md border-gray-100 flex items-center p-5 space-x-4 transition-transform duration-200 hover:scale-[1.02]">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="font-boldd text-2xl text-gray-800">{trainers.length}</p>
            <p className="text-sm text-muted-foreground">Active Trainers</p>
          </div>
        </Card>

        <Card className="rounded-xl shadow-md border-gray-100 flex items-center p-5 space-x-4 transition-transform duration-200 hover:scale-[1.02]">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-boldd text-2xl text-gray-800">{avgRating}</p>
            <p className="text-sm text-muted-foreground">Avg Rating</p>
          </div>
        </Card>

        <Card className="rounded-xl shadow-md border-gray-100 flex items-center p-5 space-x-4 transition-transform duration-200 hover:scale-[1.02]">
          <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <p className="font-boldd text-2xl text-gray-800">24+</p>
            <p className="text-sm text-muted-foreground">Sessions This Week</p>
          </div>
        </Card>

        <Card className="rounded-xl shadow-md border-gray-100 flex items-center p-5 space-x-4 transition-transform duration-200 hover:scale-[1.02]">
          <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-7 h-7 text-pink-600" />
          </div>
          <div>
            <p className="font-boldd text-2xl text-gray-800">45+</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
        </Card>
      </div>

      {/* Trainer Profile Dialog */}
      {selectedTrainerForProfile && (
        <Dialog open={!!selectedTrainerForProfile} onOpenChange={() => setSelectedTrainerForProfile(null)}>
          <DialogContent className="sm:max-w-[550px] p-6 rounded-lg shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200 mb-4">
              <DialogTitle className="text-2xl font-boldd text-gray-900">Trainer Profile</DialogTitle>
              <DialogDescription className="text-md text-muted-foreground">
                Detailed information about {trainerProfile?.name}.
              </DialogDescription>
            </DialogHeader>
            {isLoadingProfile ? (
              <div className="flex justify-center items-center h-40">
                <Clock className="w-8 h-8 animate-spin text-logoOrange" />
                <p className="ml-3 text-lg text-gray-600">Loading profile...</p>
              </div>
            ) : profileError ? (
              <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
                <p className="font-semibold text-lg">Error loading profile:</p>
                <p className="mt-1 text-sm">{profileError.message}</p>
              </div>
            ) : trainerProfile ? (
              <div className="space-y-6 py-2">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-lg flex-shrink-0">
                    <Users className="w-12 h-12 text-primary-foreground text-logoOrange" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-boldd text-gray-900">{trainerProfile.name}</h3>
                    <p className="text-md text-muted-foreground mt-1">
                      {trainerProfile.experience} years experience {trainerProfile.branch_name && ` • Branch: ${trainerProfile.branch_name}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {trainerProfile.specialization.map((spec, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-100 text-blue-800">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-700">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg">{trainerProfile.rating.toFixed(1)} / 5.0 Rating</span>
                </div>

                <div className="space-y-3 text-gray-600">
                  <h4 className="text-lg font-boldd">Contact Information:</h4>
                  <div className="flex items-center space-x-3 text-md">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span>{trainerProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-md">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span>{trainerProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-md">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>Availability: {trainerProfile.availability}</span>
                  </div>
                </div>
                {trainerProfile.description && (
                  <div className="space-y-2 text-gray-700">
                    <h4 className="text-lg font-boldd">About {trainerProfile.name}:</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{trainerProfile.description}</p>
                  </div>
                )}
              </div>
            ) : null}
            <DialogFooter className="pt-4 border-t border-gray-200 mt-4">
              <Button onClick={() => setSelectedTrainerForProfile(null)} className="px-6 py-2">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Book Session Dialog */}
      {selectedTrainerForBooking && (
        <Dialog open={!!selectedTrainerForBooking} onOpenChange={() => setSelectedTrainerForBooking(null)}>
          <DialogContent className="sm:max-w-[750px] p-6 rounded-lg shadow-xl">
            <DialogHeader className="pb-4 border-b border-gray-200 mb-4">
              <DialogTitle className="text-2xl font-boldd text-gray-900">Book Session with {selectedTrainerForBooking.name}</DialogTitle>
              <DialogDescription className="text-md text-muted-foreground">
                Select an upcoming session to book.
              </DialogDescription>
            </DialogHeader>
            {isLoadingSessionsForBooking ? (
              <div className="flex justify-center items-center h-40">
                <Clock className="w-8 h-8 animate-spin text-logoOrange" />
                <p className="ml-3 text-lg text-gray-600">Loading sessions...</p>
              </div>
            ) : sessionsForBookingError ? (
              <div className="text-red-600 bg-red-50 p-4 rounded-lg text-center">
                <p className="font-semibold text-lg">Error loading sessions:</p>
                <p className="mt-1 text-sm">{sessionsForBookingError.message}</p>
              </div>
            ) : upcomingSessions && upcomingSessions.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No upcoming sessions available from this trainer.</p>
                <p className="text-sm mt-2">Please check back later or contact the trainer directly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {upcomingSessions?.map((session) => (
                  <Card key={session.id} className="p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <h3 className="text-xl font-boldd text-gray-900 mb-2">{session.session_name}</h3>
                    <div className="space-y-1 text-gray-700">
                      <p className="text-sm flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        Date: {session.session_date ? format(parseISO(session.session_date), "PPP") : "N/A"}
                      </p>
                      <p className="text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        Time: {session.start_time && session.end_time ? `${session.start_time.substring(0, 5)} - ${session.end_time.substring(0, 5)}` : "N/A"}
                      </p>
                      <p className="text-sm flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        Capacity: {session.max_capacity !== null ? session.max_capacity : "N/A"}
                      </p>
                    </div>
                    {session.description && (
                      <CardDescription className="text-sm text-muted-foreground mt-3 leading-relaxed">
                        {session.description}
                      </CardDescription>
                    )}
                    <Button
                      className="w-full mt-5 py-2 px-4 rounded-lg text-md font-semibold bg-logoOrange hover:bg-orange-600 transition-colors"
                      onClick={() => bookSessionMutation.mutate(session)}
                      disabled={bookSessionMutation.isPending}
                    >
                      {bookSessionMutation.isPending ? "Booking..." : "Book Now"}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
            <DialogFooter className="pt-4 border-t border-gray-200 mt-4">
              <Button onClick={() => setSelectedTrainerForBooking(null)} className="px-6 py-2">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Booking Confirmation Dialog */}
      {bookingConfirmation && (
        <Dialog open={!!bookingConfirmation} onOpenChange={() => setBookingConfirmation(null)}>
          <DialogContent className="sm:max-w-[480px] p-6 rounded-lg shadow-xl text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-boldd text-green-600 mb-2">Session Booked Successfully!</DialogTitle>
              <DialogDescription className="text-md text-muted-foreground">
                You're all set for your next workout.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4 text-left text-gray-700">
              <p className="flex items-center text-lg"><strong className="w-24">Session:</strong> <span className="flex-1">{bookingConfirmation.session_name}</span></p>
              <p className="flex items-center text-lg"><strong className="w-24">Date:</strong> <span className="flex-1">{bookingConfirmation.session_date ? format(parseISO(bookingConfirmation.session_date), "PPP") : "N/A"}</span></p>
              <p className="flex items-center text-lg"><strong className="w-24">Time:</strong> <span className="flex-1">{bookingConfirmation.start_time && bookingConfirmation.end_time ? `${bookingConfirmation.start_time.substring(0, 5)} - ${bookingConfirmation.end_time.substring(0, 5)}` : "N/A"}</span></p>
              <p className="flex items-center text-lg"><strong className="w-24">Trainer:</strong> <span className="flex-1">{selectedTrainerForBooking?.name}</span></p>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-200 mt-4 flex justify-center">
              <Button onClick={() => setBookingConfirmation(null)} className="px-8 py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 transition-colors">
                Awesome!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}