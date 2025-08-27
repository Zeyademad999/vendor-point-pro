import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Globe,
  CreditCard,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { clientService } from "@/services/clients";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import RateLimitNotification from "@/components/RateLimitNotification";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessType: "",
    subdomain: "",
    plan: "professional",
    termsAccepted: false,
  });

  const businessTypes = [
    { value: "retail", label: "Retail Store" },
    { value: "salon", label: "Salon & Beauty" },
    { value: "clinic", label: "Medical Clinic" },
    { value: "restaurant", label: "Restaurant & Food" },
    { value: "gym", label: "Gym & Fitness" },
    { value: "other", label: "Other" },
  ];

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "299",
      currency: "EGP",
      period: "/month",
      features: [
        "Up to 1,000 products",
        "Basic POS system",
        "Customer management",
        "Basic reports",
        "Email support",
      ],
      popular: false,
    },
    {
      id: "professional",
      name: "Professional",
      price: "599",
      currency: "EGP",
      period: "/month",
      features: [
        "Unlimited products",
        "Advanced POS",
        "Staff management",
        "Advanced reports",
        "Branded website",
        "Booking system",
        "Priority support",
      ],
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "999",
      currency: "EGP",
      period: "/month",
      features: [
        "Everything in Pro",
        "Multi-location support",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "White-label options",
      ],
      popular: false,
    },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (
      !formData.businessName ||
      !formData.ownerName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.businessType
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.subdomain) {
      toast({
        title: "Validation Error",
        description: "Please enter a subdomain",
        variant: "destructive",
      });
      return false;
    }

    // Basic subdomain validation
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast({
        title: "Validation Error",
        description:
          "Subdomain can only contain lowercase letters, numbers, and hyphens",
        variant: "destructive",
      });
      return false;
    }

    if (formData.subdomain.length < 3 || formData.subdomain.length > 20) {
      toast({
        title: "Validation Error",
        description: "Subdomain must be between 3 and 20 characters",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (!formData.termsAccepted) {
      toast({
        title: "Validation Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create account with actual API call
      const response = await clientService.registerClient({
        businessName: formData.businessName,
        ownerName: formData.ownerName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        businessType: formData.businessType,
        subdomain: formData.subdomain,
        plan: formData.plan,
      });

      if (response.success) {
        toast({
          title: "Success!",
          description:
            "Your account has been created successfully. Logging you in...",
        });

        // Automatically log in the user with their credentials
        try {
          const loginResponse = await login(formData.email, formData.password);
          if (loginResponse) {
            toast({
              title: "Welcome!",
              description: "Redirecting to your business dashboard...",
            });

            // Redirect to the business dashboard
            setTimeout(() => {
              navigate(`/dashboard`);
            }, 1500);
          } else {
            // If auto-login fails, redirect to login page
            toast({
              title: "Account Created!",
              description: "Please log in with your credentials.",
            });
            setTimeout(() => {
              navigate(`/auth/login`);
            }, 1500);
          }
        } catch (loginError) {
          console.error("Auto-login error:", loginError);
          // If auto-login fails, redirect to login page
          toast({
            title: "Account Created!",
            description: "Please log in with your credentials.",
          });
          setTimeout(() => {
            navigate(`/auth/login`);
          }, 1500);
        }
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to create account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange("businessName", e.target.value)}
            placeholder="Enter your business name"
          />
        </div>
        <div>
          <Label htmlFor="ownerName">Owner Name *</Label>
          <Input
            id="ownerName"
            value={formData.ownerName}
            onChange={(e) => handleInputChange("ownerName", e.target.value)}
            placeholder="Enter owner name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="businessType">Business Type *</Label>
        <Select
          value={formData.businessType}
          onValueChange={(value) => handleInputChange("businessType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your business type" />
          </SelectTrigger>
          <SelectContent>
            {businessTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="Create a password"
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            placeholder="Confirm your password"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="subdomain">Your Website Address *</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => handleInputChange("subdomain", e.target.value)}
            placeholder="your-business-name"
            className="flex-1"
          />
          <span className="text-muted-foreground">.flokipos.com</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          This will be your unique website address where customers can find your
          business online.
        </p>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">What you'll get:</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>
              Professional website at{" "}
              <strong>
                {formData.subdomain || "your-business"}.flokipos.com
              </strong>
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>Online booking system for your customers</span>
          </li>
          <li className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Online payment processing</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span>Mobile-responsive design</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Choose Your Plan</h3>
        <p className="text-muted-foreground">
          Select the plan that best fits your business needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all ${
              formData.plan === plan.id
                ? "border-primary shadow-lg scale-105"
                : "hover:border-primary/50"
            } ${plan.popular ? "relative" : ""}`}
            onClick={() => handleInputChange("plan", plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.currency}</span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) =>
            handleInputChange("termsAccepted", checked as boolean)
          }
        />
        <Label htmlFor="terms" className="text-sm">
          I agree to the{" "}
          <a href="#" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </Label>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Complete Your Registration</h3>
        <p className="text-muted-foreground">
          Review your information and complete payment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Business Name:</span>
            <span className="font-semibold">{formData.businessName}</span>
          </div>
          <div className="flex justify-between">
            <span>Website:</span>
            <span className="font-semibold">
              {formData.subdomain}.flokipos.com
            </span>
          </div>
          <div className="flex justify-between">
            <span>Plan:</span>
            <span className="font-semibold">
              {plans.find((p) => p.id === formData.plan)?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Monthly Price:</span>
            <span className="font-semibold">
              {plans.find((p) => p.id === formData.plan)?.price} EGP
            </span>
          </div>
          <hr />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>
              {plans.find((p) => p.id === formData.plan)?.price} EGP/month
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">What happens next?</h4>
        <ul className="space-y-2 text-sm">
          <li>• Your account will be created immediately</li>
          <li>• Your website will be generated automatically</li>
          <li>• You'll get access to all 3 portals (Admin, Staff, Customer)</li>
          <li>• You can start customizing your business settings</li>
          <li>• 30-day free trial included</li>
        </ul>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading
          ? "Creating Your Account..."
          : "Create Account & Start Free Trial"}
      </Button>
    </div>
  );

  const steps = [
    { title: "Business Info", description: "Basic information" },
    { title: "Website Setup", description: "Choose your domain" },
    { title: "Select Plan", description: "Choose your plan" },
    { title: "Complete", description: "Review & pay" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <RateLimitNotification />
          <div className="mb-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">
                Create Your Business Account
              </CardTitle>
              <CardDescription>
                Get started with FlokiPOS and transform your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-8">
                {steps.map((stepInfo, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        step > index + 1
                          ? "bg-primary text-white"
                          : step === index + 1
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > index + 1 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium">
                        {stepInfo.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stepInfo.description}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-px mx-4 ${
                          step > index + 1 ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}

              {/* Navigation */}
              {step < 4 && (
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={step === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
