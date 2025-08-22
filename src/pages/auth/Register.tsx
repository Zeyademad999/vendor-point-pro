import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Zap, Store, Users, Coffee } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const businessTypes = [
    { value: 'retail', label: 'Retail Store', icon: <Store className="h-4 w-4" /> },
    { value: 'salon', label: 'Salon/Spa', icon: <Users className="h-4 w-4" /> },
    { value: 'restaurant', label: 'Restaurant/Cafe', icon: <Coffee className="h-4 w-4" /> },
    { value: 'clinic', label: 'Clinic/Healthcare', icon: <Users className="h-4 w-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({ title: 'Agreement Required', description: 'Please agree to terms and conditions', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      navigate('/dashboard');
      toast({ title: 'Welcome to FlokiPOS!', description: 'Your account has been created successfully' });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join FlokiPOS</h1>
          <p className="text-white/80">Start your business transformation today</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Set up your business in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    placeholder="Your Name"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="business@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          {type.icon}
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({...formData, agreeToTerms: checked as boolean})}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary hover:text-primary-dark font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/" className="text-white/80 hover:text-white text-sm transition-colors">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;