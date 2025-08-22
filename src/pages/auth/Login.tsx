import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (email === 'admin@flokipos.com') {
        navigate('/admin');
        toast({ title: 'Welcome back!', description: 'Logged in as Super Admin' });
      } else if (email === 'client@demo.com') {
        navigate('/dashboard');
        toast({ title: 'Welcome back!', description: 'Logged in successfully' });
      } else {
        toast({ title: 'Invalid credentials', description: 'Please check your email and password', variant: 'destructive' });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-blue-100">Sign in to your FlokiPOS account</p>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link to="/auth/forgot-password" className="text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/auth/register" className="text-primary hover:text-primary-dark font-semibold">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-3">Demo Accounts:</p>
              <div className="space-y-2 text-xs">
                <div className="bg-muted/50 p-2 rounded">
                  <strong>Super Admin:</strong> admin@flokipos.com
                </div>
                <div className="bg-muted/50 p-2 rounded">
                  <strong>Client:</strong> client@demo.com
                </div>
                <p className="text-center text-muted-foreground">Password: any</p>
              </div>
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

export default Login;