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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react"; // ✅ Added Loader2
import { useToast } from "@/components/ui/use-toast";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ Loading state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "",
    phone: "",
    branch: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true); // ✅ Start loading

    const dataToSend = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      gender: formData.gender,
      phone: formData.phone,
      branch: formData.branch,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        toast({
          title: "Registration Successful",
          description: "Welcome! You can now log in.",
        });
        navigate("/login");
      } else {
        const errorData = await res.json();
        toast({
          title: "Registration Failed",
          description: errorData.detail || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not connect to the server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false); // ✅ Stop loading
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="font-poppins min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Background Stickers */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/10494/10494446.png"
        alt="dumbbell"
        className="absolute top-10 left-10 w-16 h-16 opacity-20 rotate-12"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/11686/11686333.png"
        alt="train hard"
        className="absolute top-5 right-14 w-16 h-16 opacity-20 rotate-[8deg]"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/11829/11829378.png"
        alt="boxing gloves"
        className="absolute bottom-20 right-10 w-20 h-20 opacity-20 rotate-[-10deg]"
      />
      <img
        src="https://cdn-icons-png.flaticon.com/512/11829/11829384.png"
        alt="strong arms"
        className="absolute bottom-14 left-16 w-16 h-16 opacity-20 rotate-6"
      />

      {/* Registration Card */}
      <div className="w-full max-w-lg relative z-10">
        <Card className="bg-white/70 backdrop-blur-xl shadow-xl border-0 rounded-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <img src="/logo2.png" alt="SmartFlex Logo" className="h-10" />
            </div>
            <CardTitle className="text-2xl font-boldd text-gray-800">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Join <span className="text-blue-600 font-semibold">SmartFlex</span> and start your fitness journey.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              {/* Gender & Branch */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branch">Branch</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleInputChange("branch", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pune Branch">Pune Branch</SelectItem>
                      <SelectItem value="Mumbai Branch">Mumbai Branch</SelectItem>
                      <SelectItem value="Nagpur Branch">Nagpur Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
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

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full mt-4 flex items-center justify-center ${
                  loading ? "bg-gray-400" : "bg-[#6b7e86] hover:bg-[#5a6b72]"
                } text-white`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground mt-3">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
