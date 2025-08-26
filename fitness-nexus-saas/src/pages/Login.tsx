import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // Added Loader2 icon
import { useToast } from "@/components/ui/use-toast";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // ✅ New state for loading
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // ✅ Start loading

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password: password,
        }).toString(),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.user_data.name);
        localStorage.setItem("role", data.user_data.role);
        localStorage.setItem("branch", data.user_data.branch || "");
        localStorage.setItem("user_id", data.user_data.id);

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user_data.name}!`,
        });
        navigate("/dashboard");
      } else {
        const errorData = await res.json();
        toast({
          title: "Login Failed",
          description: errorData.detail || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 relative font-[Poppins]">
      {/* Background Gym Stickers */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/3048/3048394.png"
        alt="muscle flex"
        className="absolute top-10 left-10 w-16 h-16 opacity-20 rotate-6"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/1048/1048927.png"
        alt="stopwatch"
        className="absolute top-4 right-12 w-16 h-16 opacity-20 rotate-[8deg]"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/869/869695.png"
        alt="yoga stretch"
        className="absolute bottom-20 left-14 w-16 h-16 opacity-20 rotate-[-10deg]"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/677/677496.png"
        alt="protein"
        className="absolute bottom-10 right-16 w-16 h-16 opacity-20 rotate-[-8deg]"
      />

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <Card className="bg-white/70 backdrop-blur-xl shadow-xl border-0 rounded-xl">
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center items-center">
              <img src="/logo2.png" alt="SmartFlex Logo" className="h-10" />
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-800">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to your <span className="text-blue-600 font-medium">SmartFlex</span> account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${loading ? "bg-gray-400" : "bg-[#6b7e86] hover:bg-[#5a6b72]"} text-white mt-2 flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-3">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
