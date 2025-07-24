import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Assuming you have this for notifications

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // REMOVE OR MODIFY THIS STATIC SUPER ADMIN LOGIN IF YOU RELY SOLELY ON BACKEND AUTHENTICATION
    // This static login bypasses your backend logic and might cause confusion.
    // If you remove it, ensure your backend registers a superadmin for testing.
    /*
    if (email === "admin@gmail.com" && password === "123") {
      localStorage.setItem("token", "static-admin-token");
      localStorage.setItem("username", "admin"); // You might want to get this from a static config too if keeping
      localStorage.setItem("role", "superadmin");
      localStorage.setItem("branch", "Head Office"); // Static branch
      navigate("/dashboard");
      toast({
        title: "Login Successful",
        description: "Logged in as Static Super Admin.",
        variant: "success",
      });
      return;
    }
    */

    try {
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // Assuming your backend returns user data like {name, email, role, branch}
        // If your backend returns a token, you'd store data.access_token instead of "some-token"
        localStorage.setItem("token", "some-placeholder-token"); // Replace with actual token if backend sends one
        localStorage.setItem("username", data.name);
        localStorage.setItem("role", data.role); // Store the role from backend
        localStorage.setItem("branch", data.branch); // Store the branch from backend

        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.name}!`,
          variant: "success",
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
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during login.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center items-center">
              <Dumbbell className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
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
              <div className="space-y-2">
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

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}