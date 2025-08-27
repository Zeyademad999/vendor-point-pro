import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Users,
  CreditCard,
  Eye,
  EyeOff,
  Building,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStaffAuth } from "@/contexts/StaffAuthContext";

const InternalLogin = () => {
  const [loginType, setLoginType] = useState<"staff" | "cashier">("staff");
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: staffLogin } = useStaffAuth();

  const handleInternalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Staff/Cashier login - use their assigned credentials
      const portalAccess = await staffLogin({
        username: credentials.username,
        password: credentials.password,
      });

      toast({
        title: "Login Successful",
        description: `Welcome to ${loginType} portal`,
      });

      // Redirect based on portal access
      switch (portalAccess) {
        case "staff":
          navigate("/staff/dashboard");
          break;
        case "cashier":
          navigate("/cashier/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/staff/dashboard");
      }

      setCredentials({ username: "", password: "" });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLoginTypeInfo = () => {
    switch (loginType) {
      case "staff":
        return {
          title: "Staff Login",
          description: "Access staff portal and basic features",
          icon: Users,
          color: "bg-blue-100 text-blue-600",
          demoCredentials: { username: "staff1", password: "staff123" },
        };
      case "cashier":
        return {
          title: "Cashier Login",
          description: "Access POS system and transactions",
          icon: CreditCard,
          color: "bg-green-100 text-green-600",
          demoCredentials: { username: "cashier1", password: "staff123" },
        };
    }
  };

  const loginInfo = getLoginTypeInfo();
  const LoginIcon = loginInfo.icon;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Building className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Internal Portal Access
          </CardTitle>
          <CardDescription>Staff and Cashier Login</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Login Type Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Portal Access</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={loginType === "staff" ? "default" : "outline"}
                onClick={() => setLoginType("staff")}
                className="h-12 flex-col space-y-1"
              >
                <Users className="h-4 w-4" />
                <span className="text-xs">Staff</span>
              </Button>
              <Button
                type="button"
                variant={loginType === "cashier" ? "default" : "outline"}
                onClick={() => setLoginType("cashier")}
                className="h-12 flex-col space-y-1"
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Cashier</span>
              </Button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleInternalLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LoginIcon className="h-4 w-4" />
                {loginInfo.title}
              </Label>
              <p className="text-sm text-muted-foreground">
                {loginInfo.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                className="h-11"
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
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
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

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading
                ? "Signing In..."
                : `Login as ${
                    loginType.charAt(0).toUpperCase() + loginType.slice(1)
                  }`}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo Credentials:
            </p>
            <div className="bg-muted/50 p-3 rounded text-xs space-y-1">
              <div>
                <strong>Username:</strong> {loginInfo.demoCredentials.username}
              </div>
              <div>
                <strong>Password:</strong> {loginInfo.demoCredentials.password}
              </div>
            </div>
          </div>

          {/* Back to Main Dashboard */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternalLogin;
