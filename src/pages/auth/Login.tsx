import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Eye, EyeOff, Users, CreditCard, Shield } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PageTransition from "@/components/PageTransition";
import RateLimitNotification from "@/components/RateLimitNotification";
import { useApiThrottle } from "@/hooks/useApiThrottle";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, logout } = useAuth();
  const { canMakeRequest, recordRequest, getThrottleStatus } = useApiThrottle();

  // Clear any stale authentication data when accessing login page
  React.useEffect(() => {
    const clearStaleAuth = async () => {
      try {
        // Check if there's stale authentication data
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        const staffToken = localStorage.getItem("staff_token");
        const staffData = localStorage.getItem("staff_data");

        console.log("Auth cleanup check:", {
          hasToken: !!token,
          hasUser: !!user,
          hasStaffToken: !!staffToken,
          hasStaffData: !!staffData,
        });

        // Clear all authentication data to ensure clean state
        // This prevents any conflicts between main auth and staff auth
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_data");
        localStorage.removeItem("business_data");

        console.log("Cleared all authentication data for clean login state");

        // Force a page reload to ensure clean state
        if (token || user || staffToken || staffData) {
          console.log(
            "Authentication data was present, reloading page for clean state"
          );
          window.location.reload();
        }
      } catch (error) {
        // If there's an error, clear all auth data to be safe
        console.log(
          "Error during auth cleanup, clearing all auth data:",
          error
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_data");
        localStorage.removeItem("business_data");
      }
    };

    clearStaleAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check throttle before making request
    if (!canMakeRequest()) {
      const status = getThrottleStatus();
      toast({
        title: "Too many requests",
        description: `Please wait ${Math.ceil(
          status.timeUntilReset / 1000
        )} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    recordRequest();

    try {
      // Store logs in localStorage so they survive page reloads
      const logMessage = `[${new Date().toISOString()}] Attempting login with: ${email}`;
      localStorage.setItem(
        "debug_logs",
        (localStorage.getItem("debug_logs") || "") + "\n" + logMessage
      );
      console.log("Attempting login with:", { email, password });

      // Login and get user data
      const user = await login({ email, password });
      const successLog = `[${new Date().toISOString()}] Login successful, user: ${JSON.stringify(
        user
      )}`;
      localStorage.setItem(
        "debug_logs",
        (localStorage.getItem("debug_logs") || "") + "\n" + successLog
      );
      console.log("Login successful, user:", user);

      // Redirect based on user role
      let redirectPath = "/dashboard";
      let welcomeMessage = "Logged in successfully";

      switch (user.role) {
        case "admin":
        case "client":
          redirectPath = "/dashboard";
          welcomeMessage = "Welcome back to your business dashboard!";
          break;
        case "staff":
          redirectPath = "/staff/dashboard";
          welcomeMessage = `Welcome ${user.name}! Accessing staff portal for ${user.business_name}`;
          break;
        case "cashier":
          redirectPath = "/cashier/dashboard";
          welcomeMessage = `Welcome ${user.name}! Accessing POS system for ${user.business_name}`;
          break;
        default:
          redirectPath = "/dashboard";
      }

      const redirectLog = `[${new Date().toISOString()}] Redirecting to: ${redirectPath}`;
      localStorage.setItem(
        "debug_logs",
        (localStorage.getItem("debug_logs") || "") + "\n" + redirectLog
      );
      console.log("Redirecting to:", redirectPath);
      console.log("User state after login:", user);
      console.log("isAuthenticated should be:", !!user);

      // Navigate immediately
      navigate(redirectPath, { replace: true });

      toast({
        title: "Welcome back!",
        description: welcomeMessage,
      });
    } catch (error: any) {
      const errorLog = `[${new Date().toISOString()}] Login error: ${
        error.message
      }`;
      localStorage.setItem(
        "debug_logs",
        (localStorage.getItem("debug_logs") || "") + "\n" + errorLog
      );
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <PageTransition>
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
          <div className="w-full max-w-md relative">
            <RateLimitNotification />
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-white/80">Sign in to your account</p>
            </div>

            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-scale-in">
              <CardHeader className="text-center pb-4">
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your email/username and password to access your portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email / Username</Label>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your email or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      autoComplete="username"
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
                        className="h-11 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      to="/auth/forgot-password"
                      className="text-primary hover:text-primary-dark transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/auth/register"
                      className="text-primary hover:text-primary-dark font-semibold"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-white/80 hover:text-white text-sm transition-colors"
              >
                ← Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    </ProtectedRoute>
  );
};

export default Login;
