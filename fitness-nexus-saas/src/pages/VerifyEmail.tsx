// src/components/VerifyEmail.tsx or src/pages/VerifyEmail.tsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Verifying your email...");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setMessage("Invalid verification link.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setMessage("Email verified successfully! You can now log in.");
          toast({
            title: "Verification Successful",
            description: "Your email has been verified. You can now log in.",
          });
          // Redirect to the login page after a delay
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setMessage(data.detail || "Verification failed. The token may be invalid or expired.");
          toast({
            title: "Verification Failed",
            description: data.detail || "Something went wrong during verification.",
            variant: "destructive",
          });
        }
      } catch (error) {
        setMessage("An error occurred. Please try again later.");
        toast({
          title: "Network Error",
          description: "Could not connect to the server to verify your email.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, navigate, toast]);

  return (
    <div className="font-poppins min-h-screen w-full flex items-center justify-center relative p-4 bg-gradient-to-br from-blue-50 to-blue-100 text-center">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl shadow-xl rounded-xl p-8">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-4 text-gray-700">{message}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* You can add a checkmark icon or similar here for success */}
            <p className="text-xl font-bold text-gray-800">{message}</p>
            {message.includes("successfully") && (
              <p className="mt-2 text-sm text-muted-foreground">Redirecting to login...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}