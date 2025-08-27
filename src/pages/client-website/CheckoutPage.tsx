import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { clientService, WebsiteConfig } from "@/services/clients";
import { publicReceiptService } from "@/services/publicReceipts";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ChevronLeft,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CheckoutForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  payment_method: "cash" | "card" | "mobile" | "cod";
}

const CheckoutPage = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<
    "customer-info" | "payment" | "confirmation"
  >("customer-info");
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    payment_method: "card",
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);

  // Load config and cart on mount
  useEffect(() => {
    const loadData = async () => {
      if (!subdomain) return;

      try {
        const configResponse = await clientService.getWebsiteConfig(subdomain);
        if (configResponse.success) {
          setConfig(configResponse.data);
        }
      } catch (error) {
        console.error("Error loading config:", error);
      }

      // Load cart from localStorage
      const savedCart = localStorage.getItem(`cart_${subdomain}`);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        setCart(cartData);

        // Redirect to home if cart is empty
        if (cartData.length === 0) {
          navigate(`/website/${subdomain}`);
          return;
        }
      } else {
        // Redirect to home if no cart
        navigate(`/website/${subdomain}`);
        return;
      }

      setLoading(false);
    };

    loadData();
  }, [subdomain, navigate]);

  // Persist cart changes
  useEffect(() => {
    if (subdomain && cart.length > 0) {
      localStorage.setItem(`cart_${subdomain}`, JSON.stringify(cart));
    }
  }, [cart, subdomain]);

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const updateCartQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    if (subdomain) {
      localStorage.removeItem(`cart_${subdomain}`);
    }
    setCart([]);
  };

  const handleCheckout = async () => {
    if (!config) return;

    setCheckoutLoading(true);
    try {
      // Determine payment status based on payment method
      let paymentStatus: "pending" | "completed" | "paid" = "completed";
      if (checkoutForm.payment_method === "cod") {
        paymentStatus = "pending";
      } else if (checkoutForm.payment_method === "card") {
        paymentStatus = "paid";
      }

      const orderData = {
        client_id: config!.id,
        customer_name: checkoutForm.name,
        customer_email: checkoutForm.email,
        customer_phone: checkoutForm.phone,
        customer_address: `${checkoutForm.address}, ${checkoutForm.city} ${checkoutForm.postal_code}`,
        subtotal: getCartTotal(),
        tax: 0,
        discount: 0,
        total: getCartTotal(),
        payment_method: checkoutForm.payment_method,
        payment_status: paymentStatus,
        items: cart.map((item) => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        notes: `Online order from ${config?.business?.name || "website"}`,
      };

      console.log("Sending order data:", JSON.stringify(orderData, null, 2));

      // Add a small delay to show the loading animation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const response = await publicReceiptService.createPublicReceipt(
        orderData
      );

      if (response.success) {
        setOrderConfirmation(response.data);
        // Don't clear cart immediately - let user see confirmation first
        setCheckoutForm({
          name: "",
          email: "",
          phone: "",
          address: "",
          city: "",
          postal_code: "",
          payment_method: "card",
        });
        toast({
          title: "Order Successful!",
          description:
            "Your order has been placed successfully. You'll receive a confirmation email soon.",
        });
      } else {
        toast({
          title: "Order Failed",
          description:
            response.message || "Failed to place order. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Order Failed",
        description:
          "An error occurred while processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const nextCheckoutStep = () => {
    if (checkoutStep === "customer-info") {
      // Validate customer info fields
      if (
        !checkoutForm.name ||
        !checkoutForm.email ||
        !checkoutForm.phone ||
        !checkoutForm.address ||
        !checkoutForm.city ||
        !checkoutForm.postal_code
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields before continuing.",
          variant: "destructive",
        });
        return;
      }
      setCheckoutStep("payment");
    } else if (checkoutStep === "payment") {
      setCheckoutStep("confirmation");
    }
  };

  const prevCheckoutStep = () => {
    if (checkoutStep === "payment") {
      setCheckoutStep("customer-info");
    } else if (checkoutStep === "confirmation") {
      setCheckoutStep("payment");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-600">
            Loading checkout...
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

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-6">
            Add some products to get started!
          </p>
          <Button
            onClick={() => navigate(`/website/${subdomain}`)}
            className="bg-slate-800 hover:bg-slate-900 text-white"
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/website/${subdomain}`)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Checkout
                </h1>
                <p className="text-sm text-gray-500">
                  {config?.business?.name || "Store"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-500">
                Step{" "}
                {checkoutStep === "customer-info"
                  ? 1
                  : checkoutStep === "payment"
                  ? 2
                  : 3}{" "}
                of 3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                checkoutStep === "customer-info"
                  ? "text-slate-800"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  checkoutStep === "customer-info"
                    ? "bg-slate-800 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Customer Info</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${
                checkoutStep === "payment" ? "text-slate-800" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  checkoutStep === "payment"
                    ? "bg-slate-800 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Payment</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${
                checkoutStep === "confirmation"
                  ? "text-slate-800"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  checkoutStep === "confirmation"
                    ? "bg-slate-800 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                3
              </div>
              <span className="text-sm font-medium">Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {checkoutStep === "customer-info" && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">
                    Customer Information
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700"
                        >
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          value={checkoutForm.name}
                          onChange={(e) =>
                            setCheckoutForm({
                              ...checkoutForm,
                              name: e.target.value,
                            })
                          }
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={checkoutForm.email}
                          onChange={(e) =>
                            setCheckoutForm({
                              ...checkoutForm,
                              email: e.target.value,
                            })
                          }
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={checkoutForm.phone}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            phone: e.target.value,
                          })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="address"
                        className="text-sm font-medium text-gray-700"
                      >
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={checkoutForm.address}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            address: e.target.value,
                          })
                        }
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="city"
                          className="text-sm font-medium text-gray-700"
                        >
                          City
                        </Label>
                        <Input
                          id="city"
                          value={checkoutForm.city}
                          onChange={(e) =>
                            setCheckoutForm({
                              ...checkoutForm,
                              city: e.target.value,
                            })
                          }
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="postal_code"
                          className="text-sm font-medium text-gray-700"
                        >
                          Postal Code
                        </Label>
                        <Input
                          id="postal_code"
                          value={checkoutForm.postal_code}
                          onChange={(e) =>
                            setCheckoutForm({
                              ...checkoutForm,
                              postal_code: e.target.value,
                            })
                          }
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === "payment" && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <Select
                        value={checkoutForm.payment_method}
                        onValueChange={(
                          value: "cash" | "card" | "mobile" | "cod"
                        ) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            payment_method: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">
                            Credit/Debit Card
                          </SelectItem>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                          <SelectItem value="mobile">Mobile Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === "confirmation" && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">
                    Order Confirmation
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Customer Information
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Name:</strong> {checkoutForm.name}
                        </p>
                        <p>
                          <strong>Email:</strong> {checkoutForm.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {checkoutForm.phone}
                        </p>
                        <p>
                          <strong>Address:</strong> {checkoutForm.address},{" "}
                          {checkoutForm.city} {checkoutForm.postal_code}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Payment Method
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {checkoutForm.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                {checkoutStep !== "customer-info" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevCheckoutStep}
                    className="px-6"
                  >
                    Back
                  </Button>
                )}
                {checkoutStep !== "confirmation" ? (
                  <Button
                    type="button"
                    onClick={nextCheckoutStep}
                    className="px-6 bg-slate-800 hover:bg-slate-900 text-white"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="px-6 bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <motion.div
                      key={checkoutLoading ? "loading" : "ready"}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center space-x-2"
                    >
                      {checkoutLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Place Order</span>
                      )}
                    </motion.div>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      EGP {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-slate-800">
                    EGP {getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {orderConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h2>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Order Details
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-medium">
                      {orderConfirmation.receipt?.receipt_number ||
                        orderConfirmation.receipt_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">
                      EGP{" "}
                      {orderConfirmation.receipt?.total ||
                        orderConfirmation.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-medium">
                      {orderConfirmation.receipt?.payment_method ||
                        orderConfirmation.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  What's Next?
                </h3>
                <p className="text-sm text-blue-700">
                  We'll process your order and contact you soon with delivery
                  details.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setOrderConfirmation(null);
                  clearCart(); // Clear cart when user continues shopping
                  navigate(`/website/${subdomain}`);
                }}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
