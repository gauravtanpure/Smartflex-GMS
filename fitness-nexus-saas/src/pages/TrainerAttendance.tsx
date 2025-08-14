import { useEffect, useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCcw, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    gender: string;
    branch?: string;
}

export default function TrainerAttendance() {
    const [branchUsers, setBranchUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [enrollUserId, setEnrollUserId] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [enrollMessage, setEnrollMessage] = useState("");

    const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
    const [markMessage, setMarkMessage] = useState("");

    const [enrolledUsers, setEnrolledUsers] = useState<number[]>([]); // Track enrolled user IDs

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
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        if (!video) {
            setEnrollMessage("Video element not found");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
            setEnrollMessage("Failed to get 2D context");
            return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setEnrollMessage("Failed to capture image");
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "capture.jpg");

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:8000/face-enroll/${enrollUserId}`, {
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
                toast({ title: "Success", description: data.message });

                // Mark user as enrolled
                setEnrolledUsers((prev) => [...new Set([...prev, enrollUserId!])]);

                stopCamera();
                setIsEnrollModalOpen(false);
            } catch (err) {
                console.error("Error:", err);
                const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
                setEnrollMessage(`Error enrolling face: ${errMsg}`);
                toast({ title: "Error", description: errMsg, variant: "destructive" });
            }
        }, "image/jpeg");
    };

    const handleFaceAttendance = async () => {
        const canvas = document.createElement("canvas");
        const video = videoRef.current;

        if (!video) {
            setMarkMessage("Video element not found");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
            setMarkMessage("Failed to get 2D context");
            return;
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
            if (!blob) {
                setMarkMessage("Failed to capture image");
                return;
            }

            const formData = new FormData();
            formData.append("file", blob, "attendance.jpg");

            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8000/face-attendance", {
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
                toast({ title: "Success", description: data.message });
                stopCamera();
                setIsMarkModalOpen(false);
            } catch (err) {
                console.error(err);
                const errMsg = err instanceof Error ? err.message : "Unexpected error";
                setMarkMessage(`Error: ${errMsg}`);
                toast({ title: "Error", description: errMsg, variant: "destructive" });
            }
        }, "image/jpeg");
    };

    const fetchBranchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/users/branch-users", {
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
    
    // NEW: Function to fetch enrolled user IDs from the backend
    const fetchEnrolledUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8000/enrolled-users", {
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

    // Refactored to fetch both sets of data concurrently
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

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-boldd text-logoOrange">Manage Branch Users & Attendance</h1>
                <div className="flex space-x-2">
                    <Button onClick={fetchData} disabled={loading} variant="outline">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Users
                    </Button>
                    <Button
                        onClick={() => {
                            setMarkMessage("");
                            setIsMarkModalOpen(true);
                            setTimeout(startCamera, 500);
                        }}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Mark Attendance
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users in My Branch</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8 text-muted-foreground">Loading users...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Gender</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branchUsers.map(user => (
                                        <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.phone}</TableCell>
                                            <TableCell>{user.gender}</TableCell>
                                            <TableCell className="text-right">
                                                {enrolledUsers.includes(user.id) ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="secondary" size="sm" disabled>
                                                            Enrolled
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEnrollUserId(user.id);
                                                                setEnrollMessage("");
                                                                setIsEnrollModalOpen(true);
                                                                setTimeout(startCamera, 500);
                                                            }}
                                                        >
                                                            Re-enroll
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEnrollUserId(user.id);
                                                                setEnrollMessage("");
                                                                setIsEnrollModalOpen(true);
                                                                setTimeout(startCamera, 500);
                                                            }}
                                                        >
                                                            Enroll Face
                                                        </Button>
                                                    </div>
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

            <Dialog open={isEnrollModalOpen} onOpenChange={(open) => {
                setIsEnrollModalOpen(open);
                if (!open) stopCamera();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enroll Face for: {getFullName(enrollUserId!)}</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} autoPlay className="absolute w-full h-full object-cover" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <Button onClick={handleFaceEnroll} className="w-full">Capture & Enroll</Button>
                        <Button variant="outline" onClick={() => {
                            setIsEnrollModalOpen(false);
                            stopCamera();
                        }} className="w-full">Close</Button>
                    </div>
                    {enrollMessage && <p className="mt-2 text-sm font-medium text-center text-green-600">{enrollMessage}</p>}
                </DialogContent>
            </Dialog>

            <Dialog open={isMarkModalOpen} onOpenChange={(open) => {
                setIsMarkModalOpen(open);
                if (!open) stopCamera();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Attendance</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <video ref={videoRef} autoPlay className="absolute w-full h-full object-cover" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <Button onClick={handleFaceAttendance} className="w-full">Capture & Match</Button>
                        <Button variant="outline" onClick={() => {
                            setIsMarkModalOpen(false);
                            stopCamera();
                        }} className="w-full">Close</Button>
                    </div>
                    {markMessage && <p className="mt-2 text-sm font-medium text-center text-green-600">{markMessage}</p>}
                </DialogContent>
            </Dialog>
        </div>
    );
}