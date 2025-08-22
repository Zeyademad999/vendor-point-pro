import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShoppingBag, Users, BarChart3, Smartphone, Zap, Shield, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: "Complete POS System",
      description: "Intuitive point-of-sale interface with inventory management, receipts, and multi-payment support."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Customer Management", 
      description: "Track customer history, preferences, and automated birthday greetings with detailed analytics."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Reports",
      description: "Generate comprehensive reports for sales, profit/loss, staff performance, and business insights."
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Branded Website",
      description: "Auto-generated professional website with online ordering, bookings, and payment integration."
    }
  ];

  const benefits = [
    "Real-time inventory tracking",
    "Staff performance monitoring", 
    "Automated expense tracking",
    "Multi-location support",
    "24/7 customer support",
    "Secure cloud backup"
  ];

  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      features: ["Single location", "Up to 3 staff", "Basic reports", "Customer management", "Email support"],
      popular: false
    },
    {
      name: "Professional", 
      price: "$59",
      period: "/month",
      features: ["Up to 3 locations", "Unlimited staff", "Advanced reports", "Branded website", "Priority support", "API access"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$99", 
      period: "/month",
      features: ["Unlimited locations", "Custom integrations", "White-label solution", "Dedicated support", "Custom features"],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary">FlokiPOS</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="hero-gradient text-white py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <div className="animate-fade-in">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              <Star className="h-3 w-3 mr-1" />
              #1 POS Solution for Small Business
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
              Complete Business
              <br />
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Management Solution
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto animate-slide-up">
              Transform your business with our all-in-one POS system, inventory management, 
              customer tracking, and automated branded website generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Link to="/auth/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg hover-lift">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Everything Your Business Needs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to streamline operations and boost your revenue
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-gradient border-0 hover-lift glow-effect animate-scale-in">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg text-primary w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h3 className="text-3xl font-bold mb-6">Why Choose FlokiPOS?</h3>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of businesses that have transformed their operations with our comprehensive solution.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-card rounded-2xl p-8 shadow-custom-lg animate-scale-in">
              <div className="text-center">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h4 className="text-2xl font-bold mb-4">Enterprise Security</h4>
                <p className="text-muted-foreground mb-6">
                  Bank-level encryption, secure cloud storage, and automatic backups ensure your data is always protected.
                </p>
                <Button className="w-full">Learn More</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Flexible pricing that grows with your business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-glow' : ''} hover-lift animate-scale-in card-gradient border-0`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 hero-gradient text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 animate-slide-up">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-blue-100 animate-slide-up">
            Join thousands of successful businesses using FlokiPOS
          </p>
          <div className="animate-scale-in">
            <Link to="/auth/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg hover-lift">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-6 w-6 bg-gradient-primary rounded flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-primary">FlokiPOS</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Complete business management solution for modern retailers and service providers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 FlokiPOS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;