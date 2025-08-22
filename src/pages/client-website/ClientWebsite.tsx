import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Clock, MapPin, Phone, Mail, Star, Calendar, Send } from 'lucide-react';

const ClientWebsite = () => {
  const services = [
    { id: 1, name: "Premium Hair Cut", price: 45, duration: "45 min", image: "💇‍♀️" },
    { id: 2, name: "Beard Styling", price: 25, duration: "30 min", image: "🧔" },
    { id: 3, name: "Hair Washing", price: 15, duration: "20 min", image: "🚿" },
    { id: 4, name: "Facial Treatment", price: 60, duration: "60 min", image: "🧴" },
  ];

  const products = [
    { id: 1, name: "Premium Shampoo", price: 24.99, image: "🧴", stock: "In Stock" },
    { id: 2, name: "Hair Styling Gel", price: 16.99, image: "💎", stock: "In Stock" },
    { id: 3, name: "Beard Oil", price: 19.99, image: "🌿", stock: "Limited" },
    { id: 4, name: "Hair Conditioner", price: 22.99, image: "🧴", stock: "In Stock" },
  ];

  const reviews = [
    { name: "Sarah J.", rating: 5, text: "Amazing service! The staff is professional and the results are incredible." },
    { name: "Mike W.", rating: 5, text: "Best barbershop in town. Great atmosphere and excellent cuts." },
    { name: "Emma D.", rating: 4, text: "Very satisfied with my experience. Will definitely come back!" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              L
            </div>
            <div>
              <h1 className="text-xl font-bold">Luxe Salon</h1>
              <p className="text-xs text-muted-foreground">Premium Beauty Services</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#home" className="text-muted-foreground hover:text-primary transition-colors">Home</a>
            <a href="#services" className="text-muted-foreground hover:text-primary transition-colors">Services</a>
            <a href="#products" className="text-muted-foreground hover:text-primary transition-colors">Products</a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </nav>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Book Now
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 animate-fade-in">
            Experience Luxury
            <br />
            <span className="text-white/80">Beauty & Style</span>
          </h1>
          <p className="text-xl mb-8 text-white/80 max-w-2xl mx-auto animate-slide-up">
            Transform your look with our premium services. Professional stylists, premium products, exceptional results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              <Calendar className="mr-2 h-5 w-5" />
              Book Appointment
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Shop Products
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground">Professional treatments for your perfect look</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover-lift animate-scale-in text-center">
                <CardHeader>
                  <div className="text-4xl mb-4">{service.image}</div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center space-x-4">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.duration}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary mb-4">${service.price}</div>
                  <Button className="w-full">
                    Book Service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Premium Products</h2>
            <p className="text-xl text-muted-foreground">Take the salon experience home</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="hover-lift animate-scale-in">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-card flex items-center justify-center text-6xl">
                    {product.image}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">${product.price}</span>
                      <Badge variant={product.stock === 'In Stock' ? 'default' : 'secondary'}>
                        {product.stock}
                      </Badge>
                    </div>
                    <Button className="w-full">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-xl text-muted-foreground">Real reviews from satisfied customers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="hover-lift animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">&quot;{review.text}&quot;</p>
                  <p className="font-semibold">- {review.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="animate-slide-up">
              <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Ready to transform your look? Contact us to schedule your appointment.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>123 Beauty Street, New York, NY 10001</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>hello@luxesalon.com</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Mon-Sat: 9AM-7PM, Sun: 10AM-5PM</span>
                </div>
              </div>
            </div>

            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>We&apos;ll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                </div>
                <Input placeholder="Email Address" type="email" />
                <Input placeholder="Phone Number" type="tel" />
                <Textarea placeholder="Your Message" className="min-h-[100px]" />
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                L
              </div>
              <span className="font-bold">Luxe Salon</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              © 2024 Luxe Salon. All rights reserved. | Powered by FlokiPOS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientWebsite;