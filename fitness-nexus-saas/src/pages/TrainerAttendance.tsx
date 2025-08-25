import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, PlusCircle, Camera, Users, CheckCircle, Clock, Loader2, UserCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    gender: string;
    branch?: string;
}

// Spinner component for loading states
const Spinner = ({ size = "default", className = "" }: { size?: "sm" | "default" | "lg", className?: string }) => {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-6 h-6",
        lg: "w-8 h-8"
    };
    
    return (
        <div className={`inline-flex items-center justify-center ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin`} />
        </div>
    );
};

// Processing overlay component
const ProcessingOverlay = ({ message, isVisible }: { message: string, isVisible: boolean }) => {
    if (!isVisible) return null;
    
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-2xl flex flex-col items-center space-y-4 max-w-xs mx-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 dark:border-blue-900 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please wait...</p>
                </div>
            </div>
        </div>
    );
};

export default function TrainerAttendance() {
    const [branchUsers, setBranchUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessingEnroll, setIsProcessingEnroll] = useState(false);
    const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);
    const { toast } = useToast();

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollUserId, setEnrollUserId] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [enrollMessage, setEnrollMessage] = useState("");

    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [markMessage, setMarkMessage] = useState("");

    const [enrolledUsers, setEnrolledUsers] = useState<number[]>([]);

    const startCamera = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(err => toast({ title: "Camera Error", description: err.message, variant: "destructive" }));
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    const handleFaceEnroll = async () => {
        setIsProcessingEnroll(true);
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        if (!video) {
            setEnrollMessage("Video element not found");
            setIsProcessingEnroll(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
            setEnrollMessage("Failed to get 2D context");
            setIsProcessingEnroll(false);
            return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setEnrollMessage("Failed to capture image");
                setIsProcessingEnroll(false);
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "capture.jpg");

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/face-enroll/${enrollUserId}`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData,
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.detail || "Unknown error");
                }

                const data = await res.json();
                setEnrollMessage(data.message);
                toast({ 
                    title: "Enrollment Successful!", 
                    description: data.message,
                    className: "border-green-200 bg-green-50 text-green-900"
                });

                setEnrolledUsers((prev) => [...new Set([...prev, enrollUserId!])]);

                setTimeout(() => {
                    stopCamera();
                    setIsEnrollModalOpen(false);
                    setIsProcessingEnroll(false);
                }, 1500);
            } catch (err) {
                console.error("Error:", err);
                const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
                setEnrollMessage(`Error enrolling face: ${errMsg}`);
                toast({ title: "Enrollment Failed", description: errMsg, variant: "destructive" });
                setIsProcessingEnroll(false);
            }
        }, "image/jpeg");
    };

    const handleFaceAttendance = async () => {
        setIsProcessingAttendance(true);
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        if (!video) {
            setMarkMessage("Video element not found");
            setIsProcessingAttendance(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
            setMarkMessage("Failed to get 2D context");
            setIsProcessingAttendance(false);
            return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setMarkMessage("Failed to capture image");
                setIsProcessingAttendance(false);
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "attendance.jpg");

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/face-attendance`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Unknown error");
                }

                const data = await res.json();
                setMarkMessage(data.message);
                toast({ 
                    title: "Attendance Marked!", 
                    description: data.message,
                    className: "border-green-200 bg-green-50 text-green-900"
                });
                
                setTimeout(() => {
                    stopCamera();
                    setIsMarkModalOpen(false);
                    setIsProcessingAttendance(false);
                }, 1500);
            } catch (err) {
                console.error(err);
                const errMsg = err instanceof Error ? err.message : "Unexpected error";
                setMarkMessage(`Error: ${errMsg}`);
                toast({ title: "Attendance Failed", description: errMsg, variant: "destructive" });
                setIsProcessingAttendance(false);
            }
        }, "image/jpeg");
    };

    const fetchBranchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/branch-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setBranchUsers(await res.json());
            } else {
                toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Network error fetching users", variant: "destructive" });
        }
    };
    
    const fetchEnrolledUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/enrolled-users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEnrolledUsers(data.enrolled_user_ids);
            } else {
                toast({ title: "Error", description: "Failed to fetch enrolled users", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Network error fetching enrolled users", variant: "destructive" });
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([
            fetchBranchUsers(),
            fetchEnrolledUsers()
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getFullName = (userId: number) => {
        const user = branchUsers.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    };

    const enrolledCount = enrolledUsers.length;
    const totalUsers = branchUsers.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-logoOrange text-2xl font-bold bg-gradient-to-r ">
                                Attendance Management
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Manage facial recognition enrollment and track attendance
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={fetchData} 
                                disabled={loading} 
                                variant="outline" 
                                className="shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <RefreshCcw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => {
                                    setMarkMessage("");
                                    setIsMarkModalOpen(true);
                                    setTimeout(startCamera, 500);
                                }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                Mark Attendance
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                                    <p className="text-3xl font-bold">{totalUsers}</p>
                                </div>
                                <Users className="h-8 w-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Enrolled</p>
                                    <p className="text-3xl font-bold">{enrolledCount}</p>
                                </div>
                                <UserCheck className="h-8 w-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Enrollment Rate</p>
                                    <p className="text-3xl font-bold">
                                        {totalUsers > 0 ? Math.round((enrolledCount / totalUsers) * 100) : 0}%
                                    </p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users Table */}
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Users className="h-5 w-5" />
                            Branch Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12">
                                <Spinner size="lg" />
                                <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">Loading users...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                                            <TableHead className="font-semibold">User Information</TableHead>
                                            <TableHead className="font-semibold">Contact</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="text-right font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {branchUsers.map(user => (
                                            <TableRow 
                                                key={user.id} 
                                                className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors duration-150"
                                            >
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            ID: {user.id}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                                            {user.phone}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                            {user.gender}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {enrolledUsers.includes(user.id) ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Enrolled
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-600 border-gray-300">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {enrolledUsers.includes(user.id) ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setEnrollUserId(user.id);
                                                                    setEnrollMessage("");
                                                                    setIsEnrollModalOpen(true);
                                                                    setTimeout(startCamera, 500);
                                                                }}
                                                                className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200"
                                                            >
                                                                <Camera className="w-3 h-3 mr-1" />
                                                                Re-enroll
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setEnrollUserId(user.id);
                                                                setEnrollMessage("");
                                                                setIsEnrollModalOpen(true);
                                                                setTimeout(startCamera, 500);
                                                            }}
                                                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                                                        >
                                                            <Camera className="w-3 h-3 mr-1" />
                                                            Enroll Face
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Enrollment Modal */}
                <Dialog open={isEnrollModalOpen} onOpenChange={(open) => {
                    setIsEnrollModalOpen(open);
                    if (!open) {
                        stopCamera();
                        setIsProcessingEnroll(false);
                    }
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center">
                                Face Enrollment
                            </DialogTitle>
                            <p className="text-center text-gray-600 dark:text-gray-400">
                                {getFullName(enrollUserId!)}
                            </p>
                        </DialogHeader>
                        <div className="relative w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                            <video ref={videoRef} autoPlay className="absolute w-full h-full object-cover rounded-xl" />
                            <ProcessingOverlay 
                                message="Processing face enrollment..." 
                                isVisible={isProcessingEnroll}
                            />
                        </div>
                        <div className="mt-6 space-y-3">
                            <Button 
                                onClick={handleFaceEnroll} 
                                disabled={isProcessingEnroll}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                            >
                                {isProcessingEnroll ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Camera className="mr-2 h-4 w-4" />
                                        Capture & Enroll
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsEnrollModalOpen(false);
                                    stopCamera();
                                    setIsProcessingEnroll(false);
                                }} 
                                disabled={isProcessingEnroll}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                        {enrollMessage && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
                                    {enrollMessage}
                                </p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Attendance Modal */}
                <Dialog open={isMarkModalOpen} onOpenChange={(open) => {
                    setIsMarkModalOpen(open);
                    if (!open) {
                        stopCamera();
                        setIsProcessingAttendance(false);
                    }
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-center">
                                Mark Attendance
                            </DialogTitle>
                            <p className="text-center text-gray-600 dark:text-gray-400">
                                Position your face in the camera
                            </p>
                        </DialogHeader>
                        <div className="relative w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                            <video ref={videoRef} autoPlay className="absolute w-full h-full object-cover rounded-xl" />
                            <ProcessingOverlay 
                                message="Matching face and marking attendance..." 
                                isVisible={isProcessingAttendance}
                            />
                        </div>
                        <div className="mt-6 space-y-3">
                            <Button 
                                onClick={handleFaceAttendance} 
                                disabled={isProcessingAttendance}
                                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 transition-all duration-200"
                            >
                                {isProcessingAttendance ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Capture & Match
                                    </>
                                )}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsMarkModalOpen(false);
                                    stopCamera();
                                    setIsProcessingAttendance(false);
                                }} 
                                disabled={isProcessingAttendance}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                        {markMessage && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
                                    {markMessage}
                                </p>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}