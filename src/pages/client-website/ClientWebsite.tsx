import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientService, WebsiteConfig } from "@/services/clients";
import { bookingService } from "@/services/bookings";
import { productService, Product } from "@/services/products";
import { receiptService } from "@/services/receipts";
import { staffService } from "@/services/staff";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Calendar,
  Users,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Heart,
  Search,
  Filter,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  service_id: string;
  product_id?: string;
  booking_date: string;
  booking_time: string;
  notes: string;
  staff_preference: "any" | "specific";
  staff_id?: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const ClientWebsite = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    | "home"
    | "services"
    | "products"
    | "booking"
    | "contact"
    | "about"
    | "reviews"
    | "faq"
  >("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    service_id: "",
    product_id: "",
    booking_date: "",
    booking_time: "",
    notes: "",
    staff_preference: "any",
    staff_id: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  // Shopping Cart State
  // Cart state with persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem(`cart_${subdomain}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  // Animation state for button transformation
  const [animatedButtons, setAnimatedButtons] = useState<{
    [key: number]: boolean;
  }>({});
  const cartIconRef = useRef<HTMLButtonElement>(null);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
  }, [cart, subdomain]);

  // Refs for scroll-triggered animations
  const heroRef = useRef(null);
  const servicesRef = useRef(null);
  const productsRef = useRef(null);
  const bookingRef = useRef(null);
  const aboutRef = useRef(null);

  // useInView hooks for scroll animations - ensure content is always visible
  const heroInView = useInView(heroRef, { once: true, amount: 0.1 }) || true;
  const servicesInView =
    useInView(servicesRef, { once: true, amount: 0.1 }) || true;
  const productsInView =
    useInView(productsRef, { once: true, amount: 0.1 }) || true;
  const bookingInView =
    useInView(bookingRef, { once: true, amount: 0.1 }) || true;
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.1 }) || true;

  useEffect(() => {
    if (subdomain) {
      loadWebsiteConfig();
    }
  }, [subdomain]);

  const loadStaffData = useCallback(async () => {
    try {
      setStaffLoading(true);
      // Get staff data for the specific business using the client ID
      if (config?.id) {
        const response = await staffService.getPublicStaff(config.id);
        if (response.success) {
          setStaffData(response.data);
        }
      }
    } catch (error) {
      console.error("Error loading staff data:", error);
    } finally {
      setStaffLoading(false);
    }
  }, [config?.id]);

  useEffect(() => {
    if (config?.id) {
      loadStaffData();
    }
  }, [config?.id, loadStaffData]);

  const loadWebsiteConfig = async () => {
    try {
      const response = await clientService.getWebsiteConfig(subdomain!);
      if (response.success) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error("Error loading website config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !bookingForm.name ||
      !bookingForm.email ||
      !bookingForm.phone ||
      !bookingForm.service_id ||
      !bookingForm.booking_date ||
      !bookingForm.booking_time
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        service_id: parseInt(bookingForm.service_id),
        customer_name: bookingForm.name,
        customer_email: bookingForm.email,
        customer_phone: bookingForm.phone,
        booking_date: bookingForm.booking_date,
        booking_time: bookingForm.booking_time,
        notes: bookingForm.notes || "",
        client_id: config?.id || 3, // Using the client ID from config
        staff_preference: bookingForm.staff_preference,
        staff_id:
          bookingForm.staff_preference === "specific" && bookingForm.staff_id
            ? parseInt(bookingForm.staff_id)
            : null,
      };

      const response = await bookingService.createCustomerBooking(bookingData);

      if (response.success) {
        // Set confirmation data and show modal
        setBookingConfirmation(response.data);
        setShowConfirmationModal(true);

        // Also show toast
        toast({
          title: "Success!",
          description:
            "Your booking has been submitted successfully. We'll contact you soon to confirm.",
        });

        setBookingForm({
          name: "",
          email: "",
          phone: "",
          service_id: "",
          product_id: "",
          booking_date: "",
          booking_time: "",
          notes: "",
          staff_preference: "any",
          staff_id: "",
        });

        setShowBookingModal(false);
        setBookingStep(1);
        setSelectedService(null);
      } else {
        toast({
          title: "Error",
          description:
            response.message || "Failed to submit booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredServices =
    config?.services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "all" || selectedCategory.includes("Services"))
    ) || [];

  const filteredProducts =
    config?.products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "all" || selectedCategory.includes("Products"))
    ) || [];

  const categories = [
    "all",
    "Hair Services",
    "Beauty Services",
    "Hair Products",
    "Beauty Products",
    "Accessories",
  ];

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("hair") || name.includes("cut")) return <Users />;
    if (name.includes("color") || name.includes("dye")) return <Zap />;
    if (name.includes("treatment")) return <Heart />;
    if (name.includes("beard")) return <Target />;
    if (name.includes("kids")) return <Users />;
    if (name.includes("extension")) return <TrendingUp />;
    return <Users />;
  };

  const getProductIcon = (productName: string) => {
    const name = productName.toLowerCase();
    if (name.includes("shampoo") || name.includes("conditioner"))
      return <Zap />;
    if (name.includes("gel") || name.includes("spray")) return <Target />;
    if (name.includes("dryer")) return <Zap />;
    if (name.includes("brush")) return <Users />;
    if (name.includes("oil")) return <Heart />;
    if (name.includes("color")) return <TrendingUp />;
    return <ShoppingBag />;
  };

  // Cart Functions
  const addToCart = (product: any) => {
    // Start button animation
    setAnimatedButtons((prev) => ({
      ...prev,
      [product.id]: true,
    }));

    // Add to cart
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: product.id!,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images?.[0],
          },
        ];
      }
    });

    // Show cart sidebar
    setShowCartSidebar(true);

    // Show toast
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });

    // Reset animation after 2 seconds
    setTimeout(() => {
      setAnimatedButtons((prev) => ({
        ...prev,
        [product.id]: false,
      }));
    }, 2000);
  };

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    toast({
      title: "Removed from Cart",
      description: "Item has been removed from your cart.",
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">
            Loading your experience...
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            Website Not Found
          </h1>
          <p className="text-gray-600">
            The requested website could not be found.
          </p>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative bg-white py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              className="space-y-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="space-y-8">
                <h1
                  className="text-6xl md:text-7xl font-bold leading-tight"
                  style={{
                    color: config?.website?.colors?.textColor || "#1f2937",
                  }}
                >
                  {config?.website?.hero?.title ||
                    "Transform Your Look with Professional Salon Services"}
                </h1>

                <p
                  className="text-2xl leading-relaxed max-w-3xl mx-auto"
                  style={{
                    color: config?.website?.colors?.secondary || "#64748b",
                  }}
                >
                  {config?.website?.hero?.subtitle ||
                    "Experience luxury hair styling, beauty treatments, and premium salon products. Our expert stylists and beauty professionals are here to enhance your natural beauty and boost your confidence."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                  size="lg"
                  className="px-10 py-6 text-xl rounded-lg transition-all duration-300 hover:scale-105"
                  style={
                    {
                      backgroundColor:
                        config?.website?.colors?.buttonColor || "#1e40af",
                      color:
                        config?.website?.colors?.buttonTextColor || "#ffffff",
                      "--tw-hover-bg-opacity": "0.9",
                    } as React.CSSProperties
                  }
                  onClick={() => setActiveTab("products")}
                >
                  Shop Products
                  <ArrowRight className="h-6 w-6 ml-3" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 px-10 py-6 text-xl rounded-lg transition-all duration-300 hover:scale-105"
                  style={
                    {
                      borderColor:
                        config?.website?.colors?.buttonColor || "#1e40af",
                      color: config?.website?.colors?.buttonColor || "#1e40af",
                      "--tw-hover-bg-opacity": "0.1",
                    } as React.CSSProperties
                  }
                  onClick={() => setActiveTab("services")}
                >
                  View Services
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
              Why Choose Us
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine expertise, innovation, and dedication to deliver
              exceptional results.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <Target className="h-8 w-8 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Expert Team
              </h3>
              <p className="text-gray-600">
                Our experienced professionals are dedicated to delivering the
                best results.
              </p>
            </motion.div>
            <motion.div
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <Shield className="h-8 w-8 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Quality Guarantee
              </h3>
              <p className="text-gray-600">
                We stand behind our work with a 100% satisfaction guarantee.
              </p>
            </motion.div>
            <motion.div
              className="text-center group hover:transform hover:scale-105 transition-all duration-300"
              initial={{ opacity: 0, y: 50 }}
              animate={
                heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
              }
              transition={{ duration: 0.6, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-slate-200 transition-colors">
                <TrendingUp className="h-8 w-8 text-slate-800" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Proven Results
              </h3>
              <p className="text-gray-600">
                Track record of success with hundreds of satisfied customers.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      {config?.services && config.services.length > 0 && (
        <section ref={servicesRef} className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={
                servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
                Our Services
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Professional Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Services Offered
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {config.services.slice(0, 6).map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    servicesInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 50 }
                  }
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                          {getServiceIcon(service.name)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {service.duration} min
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-gray-900">
                        {service.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {service.description ||
                          "Professional service with expert care"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-slate-800">
                          EGP {service.price}
                        </span>
                      </div>
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Professional Quality
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Expert Staff
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Satisfaction Guaranteed
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Learn More
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
                          onClick={() => {
                            setSelectedService(service);
                            setShowBookingModal(true);
                            setBookingStep(1);
                          }}
                        >
                          Book Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {config?.services && config.services.length > 6 && (
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.6,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTab("services")}
                  className="border-2 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg rounded-lg"
                >
                  View All Services
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Products Preview */}
      {config?.products && config.products.length > 0 && (
        <section ref={productsRef} className="bg-white py-20">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={
                productsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
              }
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
                Featured Products
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Premium Products
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Featured Products
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {config.products.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    productsInView
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 50 }
                  }
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="relative">
                      <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                        {Array.isArray(product.images) &&
                        product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            {getProductIcon(product.name)}
                          </div>
                        )}
                      </div>
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-slate-800 text-white">
                          Featured
                        </Badge>
                      )}
                      {(index === 1 || index === 2) && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                          Sale
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-slate-100 text-slate-700"
                        >
                          {index < 4 ? "Hair Products" : "Beauty Products"}
                        </Badge>
                        <div className="flex items-center text-sm">
                          <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                          <span className="text-gray-600">4.9 (124)</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg text-gray-900 mb-2">
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-slate-800">
                          EGP {product.price}
                        </span>
                        {product.stock === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className={`w-full transition-all duration-500 ${
                            animatedButtons[product.id]
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-slate-800 hover:bg-slate-900 text-white"
                          }`}
                          disabled={product.stock === 0}
                          onClick={() => addToCart(product)}
                        >
                          <motion.div
                            animate={{
                              rotate: animatedButtons[product.id] ? 360 : 0,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {animatedButtons[product.id] ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <ShoppingBag className="h-4 w-4 mr-2" />
                            )}
                          </motion.div>
                          {product.stock > 0
                            ? animatedButtons[product.id]
                              ? "Added!"
                              : "Add to Cart"
                            : "Out of Stock"}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {config?.products && config.products.length > 8 && (
              <motion.div
                className="text-center mt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  productsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTab("products")}
                  className="border-2 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg rounded-lg"
                >
                  View All Products
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
              Testimonials
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by industry leaders and growing businesses worldwide.
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Card className="border-0 shadow-xl bg-white p-12">
              <div className="flex items-start justify-between mb-8">
                <div className="text-6xl text-gray-200">"</div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-6 w-6 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
              </div>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                "Process optimization delivered incredible results. Our
                operational efficiency improved by 180% and costs reduced
                significantly."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-bold">JW</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">James Wilson</p>
                    <p className="text-gray-600">VP Operations, ScaleCo</p>
                  </div>
                </div>
                <Badge className="bg-slate-800 text-white">
                  Process Optimization
                </Badge>
              </div>
              <div className="flex justify-center mt-8 space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );

  const renderServices = () => (
    <section ref={servicesRef} className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={
            servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
          }
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
            Our Services
          </Badge>
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            Professional Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Services Offered
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          className="max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={
            servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
          }
          transition={{ duration: 0.6, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 50 }}
                animate={
                  servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                        {getServiceIcon(service.name)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {service.duration} min
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-slate-800">
                        EGP {service.price}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < 4
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Professional Quality
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Expert Staff
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Satisfaction Guaranteed
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white"
                      >
                        Learn More
                      </Button>
                      <Button
                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white"
                        onClick={() => {
                          setSelectedService(service);
                          setShowBookingModal(true);
                          setBookingStep(1);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 30 }}
            animate={
              servicesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-600">
              {searchTerm || selectedCategory !== "all"
                ? "No services found"
                : "Services Coming Soon!"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "We're working hard to bring you amazing services. Check back soon!"}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-4 bg-slate-800 hover:bg-slate-900 text-white"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );

  const renderProducts = () => (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
            Our Products
          </Badge>
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            Premium Products
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Featured Products
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product, index) => (
              <Card
                key={product.id}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center overflow-hidden">
                    {Array.isArray(product.images) &&
                    product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onLoad={() =>
                          console.log(
                            "Image loaded successfully:",
                            product.images[0]
                          )
                        }
                        onError={(e) =>
                          console.error(
                            "Image failed to load:",
                            product.images[0],
                            e
                          )
                        }
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        {getProductIcon(product.name)}
                      </div>
                    )}
                  </div>
                  {index < 2 && (
                    <Badge className="absolute top-2 left-2 bg-slate-800 text-white">
                      Featured
                    </Badge>
                  )}
                  {product.stock < 5 && product.stock > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                      Low Stock
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge className="absolute top-2 right-2 bg-gray-500 text-white">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-slate-100 text-slate-700"
                    >
                      {index < 4 ? "Hair Products" : "Beauty Products"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
                  <CardDescription className="text-gray-600 mb-4">
                    {product.description}
                  </CardDescription>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-slate-800">
                      EGP {product.price}
                    </span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < 4
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      Stock: {product.stock} available
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      Free Shipping
                    </span>
                  </div>
                  <Button
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                    disabled={product.stock === 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-600">
              {searchTerm || selectedCategory !== "all"
                ? "No products found"
                : "Products Coming Soon!"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter criteria"
                : "We're curating amazing products for you. Check back soon!"}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-4 bg-slate-800 hover:bg-slate-900 text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );

  const renderBooking = () => (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-slate-800 text-white px-4 py-2 rounded-full mb-4">
              Book Now
            </Badge>
            <h1 className="text-4xl font-bold mb-6 text-gray-900">
              Schedule Your Appointment
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fill out the form below to schedule your appointment or place an
              order. We'll get back to you within 24 hours to confirm.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Booking Form */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl">Booking Form</CardTitle>
                <CardDescription className="text-lg">
                  Fill out the form below to schedule your appointment or place
                  an order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-gray-700 font-medium"
                      >
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={bookingForm.name}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="email"
                        className="text-gray-700 font-medium"
                      >
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter your email"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="phone"
                      className="text-gray-700 font-medium"
                    >
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      value={bookingForm.phone}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="Enter your phone number"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="service"
                      className="text-gray-700 font-medium"
                    >
                      Service *
                    </Label>
                    <Select
                      value={bookingForm.service_id}
                      onValueChange={(value) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          service_id: value,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {config?.services.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.name} - ${service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="date"
                        className="text-gray-700 font-medium"
                      >
                        Preferred Date *
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={bookingForm.booking_date}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            booking_date: e.target.value,
                          }))
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="time"
                        className="text-gray-700 font-medium"
                      >
                        Preferred Time *
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={bookingForm.booking_time}
                        onChange={(e) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            booking_time: e.target.value,
                          }))
                        }
                        className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="notes"
                      className="text-gray-700 font-medium"
                    >
                      Additional Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      value={bookingForm.notes}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Any special requests or additional information..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-lg py-4 bg-slate-800 hover:bg-slate-900 text-white border-0 rounded-lg"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Booking Request"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-slate-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Phone</h3>
                      <p className="text-gray-600">{config?.business?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-slate-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">{config?.business?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-slate-800" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Business Hours
                      </h3>
                      <p className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM
                      </p>
                      <p className="text-gray-600">
                        Saturday: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-slate-800 text-white">
                <CardHeader>
                  <CardTitle className="text-xl text-white">
                    Why Choose Us?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Professional & Experienced Staff</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Flexible Scheduling Options</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Competitive Pricing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderContact = () => (
    <div className="max-w-4xl mx-auto space-y-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">Contact Us</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get in touch with us for any questions or inquiries
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Get in Touch
            </h2>
            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Phone className="h-8 w-8 text-slate-800" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Phone</h3>
                  <p className="text-gray-600 text-lg">
                    {config.business.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-slate-800" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Email</h3>
                  <p className="text-gray-600 text-lg">
                    {config.business.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-slate-800" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Business Hours
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Monday - Friday: 9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a Message</CardTitle>
            <CardDescription className="text-lg">
              We'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="contact-name"
                  className="text-gray-700 font-medium"
                >
                  Name *
                </Label>
                <Input
                  id="contact-name"
                  placeholder="Your name"
                  className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                />
              </div>
              <div>
                <Label
                  htmlFor="contact-email"
                  className="text-gray-700 font-medium"
                >
                  Email *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="Your email"
                  className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="contact-subject"
                className="text-gray-700 font-medium"
              >
                Subject *
              </Label>
              <Input
                id="contact-subject"
                placeholder="Subject"
                className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
              />
            </div>
            <div>
              <Label
                htmlFor="contact-message"
                className="text-gray-700 font-medium"
              >
                Message *
              </Label>
              <Textarea
                id="contact-message"
                placeholder="Your message..."
                rows={4}
                className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
              />
            </div>
            <Button className="w-full bg-slate-800 hover:bg-slate-900 text-white border-0 rounded-lg py-3">
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold">
                  P
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {config?.business?.name}
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => setActiveTab("home")}
                  className={`transition-colors ${
                    activeTab === "home"
                      ? "text-slate-800 font-semibold"
                      : "text-gray-600 hover:text-slate-800"
                  }`}
                >
                  Home
                </button>
                {config?.products && config.products.length > 0 && (
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`transition-colors ${
                      activeTab === "products"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600 hover:text-slate-800"
                    }`}
                  >
                    Shop
                  </button>
                )}
                {config?.services && config.services.length > 0 && (
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`transition-colors ${
                      activeTab === "services"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600 hover:text-slate-800"
                    }`}
                  >
                    Services
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("about")}
                  className={`transition-colors ${
                    activeTab === "about"
                      ? "text-slate-800 font-semibold"
                      : "text-gray-600 hover:text-slate-800"
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`transition-colors ${
                    activeTab === "reviews"
                      ? "text-slate-800 font-semibold"
                      : "text-gray-600 hover:text-slate-800"
                  }`}
                >
                  Reviews
                </button>
                <button
                  onClick={() => setActiveTab("faq")}
                  className={`transition-colors ${
                    activeTab === "faq"
                      ? "text-slate-800 font-semibold"
                      : "text-gray-600 hover:text-slate-800"
                  }`}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`transition-colors ${
                    activeTab === "contact"
                      ? "text-slate-800 font-semibold"
                      : "text-gray-600 hover:text-slate-800"
                  }`}
                >
                  Contact
                </button>
              </nav>

              {/* Shopping Cart Button */}
              {config?.products && config.products.length > 0 && (
                <Button
                  ref={cartIconRef}
                  variant="outline"
                  className="relative border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white"
                  onClick={() => setShowCartSidebar(true)}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Cart
                  {getCartItemCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getCartItemCount()}
                    </span>
                  )}
                </Button>
              )}

              {/* Book Appointment Button */}
              <Button
                className="bg-slate-800 hover:bg-slate-900 text-white"
                onClick={() => setShowBookingModal(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-200">
                <nav className="flex flex-col space-y-4">
                  <button
                    onClick={() => {
                      setActiveTab("home");
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left py-2 ${
                      activeTab === "home"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    Home
                  </button>
                  {config?.products && config.products.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab("products");
                        setMobileMenuOpen(false);
                      }}
                      className={`text-left py-2 ${
                        activeTab === "products"
                          ? "text-slate-800 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Shop
                    </button>
                  )}
                  {config?.services && config.services.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab("services");
                        setMobileMenuOpen(false);
                      }}
                      className={`text-left py-2 ${
                        activeTab === "services"
                          ? "text-slate-800 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Services
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveTab("about");
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left py-2 ${
                      activeTab === "about"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("reviews");
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left py-2 ${
                      activeTab === "reviews"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("faq");
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left py-2 ${
                      activeTab === "faq"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    FAQ
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("contact");
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left py-2 ${
                      activeTab === "contact"
                        ? "text-slate-800 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    Contact
                  </button>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {activeTab === "home" && renderHome()}
          {activeTab === "services" && renderServices()}
          {activeTab === "products" && renderProducts()}
          {activeTab === "booking" && renderBooking()}
          {activeTab === "contact" && renderContact()}
          {activeTab === "about" && (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">
                About Us
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We are dedicated to providing exceptional services and products
                to help you achieve your goals.
              </p>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">Reviews</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See what our clients have to say about our services.
              </p>
            </div>
          )}
          {activeTab === "faq" && (
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">FAQ</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Frequently asked questions about our services and products.
              </p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-8 w-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold">
                    P
                  </div>
                  <span className="text-xl font-bold">
                    {config?.business?.name}
                  </span>
                </div>
                <p className="text-gray-400 mb-6">
                  Premium services and products designed to elevate your
                  business to new heights.
                </p>
                <div className="flex space-x-4">
                  <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </button>
                  <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </button>
                  <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </button>
                  <button className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-900 transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-6">Quick Links</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab("services")}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Products
                  </button>
                  <button
                    onClick={() => setActiveTab("booking")}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setActiveTab("contact")}
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-6">Services</h3>
                <div className="space-y-3">
                  {config?.services?.slice(0, 4).map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setShowBookingModal(true);
                        setBookingStep(1);
                      }}
                      className="block text-gray-400 hover:text-white transition-colors text-left"
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-6">Contact Info</h3>
                <div className="space-y-3 text-gray-400">
                  <p>{config?.business?.phone}</p>
                  <p>{config?.business?.email}</p>
                  <p>Mon-Fri: 9AM-6PM</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center">
              <p className="text-gray-400">
                © 2024 {config?.business?.name}. All rights reserved.
              </p>
              <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-400">
                <button className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
                <button className="hover:text-white transition-colors">
                  Terms of Service
                </button>
                <button className="hover:text-white transition-colors">
                  Cookie Policy
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Accepted payments: Visa, Mastercard, PayPal
              </p>
            </div>
          </div>
        </footer>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Book Your Appointment
                  </h2>
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      setBookingStep(1);
                      setSelectedService(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        bookingStep >= 1
                          ? "bg-slate-800 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      1
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        bookingStep >= 2
                          ? "bg-slate-800 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      2
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        bookingStep >= 3
                          ? "bg-slate-800 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      3
                    </div>
                  </div>
                </div>

                {bookingStep === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Select Service
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {config?.services?.map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedService?.id === service.id
                              ? "border-slate-800 bg-slate-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            setSelectedService(service);
                            setBookingForm((prev) => ({
                              ...prev,
                              service_id: service.id.toString(),
                            }));
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {service.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {service.duration} min
                              </p>
                            </div>
                            <span className="font-bold text-slate-800">
                              EGP {service.price}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={() => setBookingStep(2)}
                        disabled={!selectedService}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {bookingStep === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Staff Selection (Optional)
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          You can choose to book with any available staff member
                          or select a specific staff member for your
                          appointment.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div
                          className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:border-slate-300"
                          onClick={() =>
                            setBookingForm((prev) => ({
                              ...prev,
                              staff_preference: "any",
                              staff_id: "",
                            }))
                          }
                        >
                          <input
                            type="radio"
                            checked={bookingForm.staff_preference === "any"}
                            onChange={() => {}}
                            className="text-slate-800 focus:ring-slate-800"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              Any Available Staff Member
                            </h4>
                            <p className="text-sm text-gray-600">
                              We'll assign you to the best available staff
                              member
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:border-slate-300"
                          onClick={() =>
                            setBookingForm((prev) => ({
                              ...prev,
                              staff_preference: "specific",
                              staff_id: "",
                            }))
                          }
                        >
                          <input
                            type="radio"
                            checked={
                              bookingForm.staff_preference === "specific"
                            }
                            onChange={() => {}}
                            className="text-slate-800 focus:ring-slate-800"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              Choose Specific Staff Member
                            </h4>
                            <p className="text-sm text-gray-600">
                              Select a preferred staff member for your
                              appointment
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Staff Selection Dropdown */}
                      {bookingForm.staff_preference === "specific" && (
                        <div className="mt-4">
                          <Label className="text-gray-700 font-medium">
                            Select Staff Member
                          </Label>
                          <Select
                            value={bookingForm.staff_id}
                            onValueChange={(value) =>
                              setBookingForm((prev) => ({
                                ...prev,
                                staff_id: value,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Choose a staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffLoading ? (
                                <SelectItem value="" disabled>
                                  Loading staff...
                                </SelectItem>
                              ) : staffData.length > 0 ? (
                                staffData.map((staff) => (
                                  <SelectItem
                                    key={staff.id}
                                    value={staff.id.toString()}
                                  >
                                    {staff.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  No staff available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {selectedService && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Booking Summary
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Service: {selectedService.name}</p>
                            <p>Duration: {selectedService.duration} min</p>
                            <p>Price: EGP {selectedService.price}</p>
                            <p>
                              Staff:{" "}
                              {bookingForm.staff_preference === "any"
                                ? "Any available"
                                : "Specific staff member"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setBookingStep(1)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setBookingStep(3)}
                        disabled={
                          bookingForm.staff_preference === "specific" &&
                          !bookingForm.staff_id
                        }
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {bookingStep === 3 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Pick Date & Time
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="modal-date"
                          className="text-gray-700 font-medium"
                        >
                          Date
                        </Label>
                        <Input
                          id="modal-date"
                          type="date"
                          value={bookingForm.booking_date}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              booking_date: e.target.value,
                            }))
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="modal-time"
                          className="text-gray-700 font-medium"
                        >
                          Time
                        </Label>
                        <Input
                          id="modal-time"
                          type="time"
                          value={bookingForm.booking_time}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              booking_time: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                      {selectedService && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Booking Summary
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Service: {selectedService.name}</p>
                            <p>Duration: {selectedService.duration} min</p>
                            <p>Price: EGP {selectedService.price}</p>
                            <p>
                              Staff:{" "}
                              {bookingForm.staff_preference === "any"
                                ? "Any available"
                                : "Specific staff member"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setBookingStep(2)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={() => setBookingStep(4)}
                        disabled={
                          !bookingForm.booking_date || !bookingForm.booking_time
                        }
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {bookingStep === 4 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Your Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="modal-name"
                          className="text-gray-700 font-medium"
                        >
                          Full Name *
                        </Label>
                        <Input
                          id="modal-name"
                          placeholder="Your name"
                          value={bookingForm.name}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="modal-phone"
                          className="text-gray-700 font-medium"
                        >
                          Phone Number *
                        </Label>
                        <Input
                          id="modal-phone"
                          placeholder="Your phone number"
                          value={bookingForm.phone}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="modal-email"
                          className="text-gray-700 font-medium"
                        >
                          Email Address *
                        </Label>
                        <Input
                          id="modal-email"
                          type="email"
                          placeholder="Your email"
                          value={bookingForm.email}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="modal-notes"
                          className="text-gray-700 font-medium"
                        >
                          Additional Notes (Optional)
                        </Label>
                        <Textarea
                          id="modal-notes"
                          placeholder="Any specific requirements or questions..."
                          value={bookingForm.notes}
                          onChange={(e) =>
                            setBookingForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          rows={3}
                          className="border-2 border-gray-200 focus:border-slate-800 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setBookingStep(3)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleBookingSubmit}
                        disabled={
                          bookingLoading ||
                          !bookingForm.name ||
                          !bookingForm.email ||
                          !bookingForm.phone
                        }
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        {bookingLoading ? "Submitting..." : "Confirm Booking"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {showConfirmationModal && bookingConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Booking Confirmed!
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Booking Details
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span className="font-medium">
                        {bookingConfirmation.service_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {new Date(
                          bookingConfirmation.booking_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">
                        {bookingConfirmation.booking_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {bookingConfirmation.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">
                        EGP {bookingConfirmation.price}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff:</span>
                      <span className="font-medium">
                        {bookingConfirmation.staff_preference === "any"
                          ? "Any available"
                          : "Specific staff member"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    What's Next?
                  </h3>
                  <p className="text-sm text-blue-700">
                    We'll contact you within 24 hours to confirm your
                    appointment and provide any additional details.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setBookingConfirmation(null);
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmationModal(false);
                    setBookingConfirmation(null);
                    setShowBookingModal(true);
                  }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Book Another Service
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Shopping Cart Sidebar */}
        <AnimatePresence>
          {showCartSidebar && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50"
                onClick={() => setShowCartSidebar(false)}
              />

              {/* Sidebar */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 200,
                  duration: 0.4,
                }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <ShoppingBag className="h-6 w-6 text-slate-800" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Shopping Cart
                    </h2>
                    <Badge variant="secondary" className="ml-2">
                      {getCartItemCount()}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setShowCartSidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Add some products to get started!
                      </p>
                      <Button
                        onClick={() => {
                          setShowCartSidebar(false);
                          setActiveTab("products");
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Start Shopping
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {cart.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              EGP {item.price.toFixed(2)}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  updateCartQuantity(item.id, item.quantity + 1)
                                }
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-gray-200 p-6 bg-white"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-900">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-slate-800">
                        EGP {getCartTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={() => {
                          console.log("Proceed to checkout clicked");
                          setShowCartSidebar(false);
                          navigate(`/website/${subdomain}/checkout`);
                        }}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white h-12 text-lg font-medium"
                      >
                        Proceed to Checkout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCartSidebar(false);
                          setActiveTab("products");
                        }}
                        className="w-full h-12"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default ClientWebsite;
