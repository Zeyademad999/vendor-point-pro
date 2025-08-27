import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Search,
  Minus,
  Plus,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  Loader2,
  X,
  Package,
  Scissors,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { productService } from "@/services/products";
import { serviceService } from "@/services/services";
import { customerService } from "@/services/customers";
import {
  receiptService,
  CreateReceiptData,
  ReceiptItem,
} from "@/services/receipts";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service";
  product_id?: number;
  service_id?: number;
  stock?: number;
}

// Define proper types for POS items
interface POSItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  type: "product" | "service";
  category_id?: number;
  category_name?: string;
  stock?: number;
  duration?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface Receipt {
  id: number;
  receipt_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
    type: "product" | "service";
  }>;
  total_amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  staff_name?: string;
  created_at: string;
  updated_at: string;
}

const POSInterface = () => {
  console.log("POS Interface component rendering");
  const { user } = useAuth();
  const { toast } = useToast();

  // Add logging to see if POS loads
  useEffect(() => {
    const posLog = `[${new Date().toISOString()}] POS Interface loaded, user: ${JSON.stringify(
      user
    )}`;
    localStorage.setItem(
      "debug_logs",
      (localStorage.getItem("debug_logs") || "") + "\n" + posLog
    );
    console.log("POS Interface loaded, user:", user);
  }, [user]);

  // Add error boundary logging
  useEffect(() => {
    const errorLog = `[${new Date().toISOString()}] POS Interface component rendering, user: ${JSON.stringify(
      user
    )}`;
    localStorage.setItem(
      "debug_logs",
      (localStorage.getItem("debug_logs") || "") + "\n" + errorLog
    );
    console.log("POS Interface component rendering, user:", user);
  }, []);

  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile" | "other" | "cod"
  >("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "fixed"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);

  // Data state
  const [products, setProducts] = useState<POSItem[]>([]);
  const [services, setServices] = useState<POSItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredItems, setFilteredItems] = useState<POSItem[]>([]);

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Filter items based on search term and active tab
  useEffect(() => {
    let items: POSItem[] = [];

    if (activeTab === "products") {
      items = (products || []).map((p) => ({ ...p, type: "product" as const }));
    } else if (activeTab === "services") {
      items = (services || []).map((s) => ({ ...s, type: "service" as const }));
    } else {
      // All items for search
      items = [
        ...(products || []).map((p) => ({ ...p, type: "product" as const })),
        ...(services || []).map((s) => ({ ...s, type: "service" as const })),
      ];
    }

    if (searchTerm.trim()) {
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, products, services, activeTab]);

  // Add error handling for component render
  if (!user) {
    console.log("POS Interface: No user available, showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading POS system...</p>
        </div>
      </div>
    );
  }

  console.log("POS Interface: User available, rendering main interface");

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("POS: Loading data for user:", user);

      // For cashier users, load their business's products and services
      if (user?.role === "cashier") {
        console.log(
          "POS: Cashier user detected, loading business data for business_id:",
          user.business_id
        );

        try {
          // Load products and services for the cashier's business
          const [productsResponse, servicesResponse] = await Promise.all([
            productService.getProducts({ limit: 100 }).catch((err) => {
              console.warn(
                "POS: Products API failed for cashier:",
                err.message
              );
              return { success: false, data: [], message: err.message };
            }),
            serviceService.getServices({ limit: 100 }).catch((err) => {
              console.warn(
                "POS: Services API failed for cashier:",
                err.message
              );
              return { success: false, data: [], message: err.message };
            }),
          ]);

          console.log("POS: Cashier API responses:", {
            productsResponse,
            servicesResponse,
          });

          if (productsResponse.success) {
            setProducts(productsResponse.data || []);
            console.log(
              "POS: Successfully loaded products for cashier:",
              productsResponse.data?.length || 0
            );
          } else {
            console.warn(
              "POS: Products API failed for cashier:",
              (productsResponse as any).message
            );
            setProducts([]);
          }

          if (servicesResponse.success) {
            setServices(servicesResponse.data || []);
            console.log(
              "POS: Successfully loaded services for cashier:",
              servicesResponse.data?.length || 0
            );
          } else {
            console.warn(
              "POS: Services API failed for cashier:",
              (servicesResponse as any).message
            );
            setServices([]);
          }

          // Set empty customers array - cashiers don't need customer management
          setCustomers([]);

          // Show success message
          const totalItems =
            (productsResponse.success
              ? productsResponse.data?.length || 0
              : 0) +
            (servicesResponse.success ? servicesResponse.data?.length || 0 : 0);

          if (totalItems > 0) {
            toast({
              title: "POS Ready",
              description: `Loaded ${totalItems} items from your business`,
              variant: "default",
            });
          } else {
            toast({
              title: "POS Ready",
              description: "No items found in your business",
              variant: "default",
            });
          }
        } catch (error) {
          console.error("POS: Error loading data for cashier:", error);
          setProducts([]);
          setServices([]);
          setCustomers([]);

          toast({
            title: "Error",
            description: "Failed to load business data",
            variant: "destructive",
          });
        }

        setLoading(false);
        return;
      }

      // Load products, services, and customers in parallel for business owners
      const [productsResponse, servicesResponse, customersResponse] =
        await Promise.all([
          productService.getProducts({ limit: 100 }).catch((err) => ({
            success: false,
            data: [],
            message: err.message,
          })),
          serviceService.getServices({ limit: 100 }).catch((err) => ({
            success: false,
            data: [],
            message: err.message,
          })),
          customerService.getCustomers({ limit: 100 }).catch((err) => ({
            success: false,
            data: [],
            message: err.message,
          })),
        ]);

      console.log("POS: API responses:", {
        productsResponse,
        servicesResponse,
        customersResponse,
      });

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      } else {
        console.warn(
          "POS: Products API failed:",
          (productsResponse as any).message
        );
        setProducts([]);
      }

      if (servicesResponse.success) {
        setServices(servicesResponse.data || []);
      } else {
        console.warn(
          "POS: Services API failed:",
          (servicesResponse as any).message
        );
        setServices([]);
      }

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      } else {
        console.warn(
          "POS: Customers API failed:",
          (customersResponse as any).message
        );
        setCustomers([]);
      }
    } catch (error) {
      console.error("POS: Error loading data:", error);
      // Set empty arrays to prevent undefined errors
      setProducts([]);
      setServices([]);
      setCustomers([]);
      toast({
        title: "Error",
        description: "Failed to load some data, but POS is still functional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addManualItem = (type: "product" | "service") => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    const price = parseFloat(prompt(`Enter ${type} price:`) || "0");
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    const manualItem = {
      id: `manual-${Date.now()}`,
      name,
      price,
      type,
      description: `Manual ${type}`,
    };

    addToCart(manualItem);

    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Added`,
      description: `${name} added to cart`,
      variant: "default",
    });
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find(
      (cartItem) => cartItem.id === `${item.type}-${item.id}`
    );

    if (existingItem) {
      // Check stock for products
      if (item.type === "product" && item.stock !== null) {
        if (existingItem.quantity >= item.stock) {
          toast({
            title: "Stock Limit",
            description: `Only ${item.stock} units available in stock`,
            variant: "destructive",
          });
          return;
        }
      }

      setCart(
        cart.map((cartItem) =>
          cartItem.id === existingItem.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      const cartItem: CartItem = {
        id: `${item.type}-${item.id}`,
        name: item.name,
        price: parseFloat(item.price),
        quantity: 1,
        type: item.type,
        product_id: item.type === "product" ? item.id : undefined,
        service_id: item.type === "service" ? item.id : undefined,
        stock: item.stock,
      };
      setCart([...cart, cartItem]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantity + change;

            // Check stock limit for products
            if (
              item.type === "product" &&
              item.stock !== null &&
              newQuantity > item.stock
            ) {
              toast({
                title: "Stock Limit",
                description: `Only ${item.stock} units available in stock`,
                variant: "destructive",
              });
              return item;
            }

            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = () => {
    // You can implement tax calculation logic here
    return 0;
  };

  const getDiscount = () => {
    if (discountValue <= 0) return 0;

    if (discountType === "fixed") {
      return Math.min(discountValue, getSubtotal()); // Don't discount more than subtotal
    } else {
      // Percentage discount
      const percentageDiscount = (getSubtotal() * discountValue) / 100;
      return Math.min(percentageDiscount, getSubtotal()); // Don't discount more than subtotal
    }
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - getDiscount();
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("");
    setPaymentMethod("cash");
    setDiscountValue(0);
    setDiscountType("fixed");
  };

  const downloadReceipt = () => {
    if (!lastReceipt) return;

    // Create receipt content for PDF
    const receiptContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #2563eb; }
            .subtitle { font-size: 12px; color: #666; }
            .receipt-number { font-size: 14px; color: #666; margin-top: 5px; }
            .customer-info { margin: 15px 0; }
            .items { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .item-details { flex: 1; }
            .item-price { font-weight: bold; }
            .totals { border-top: 1px solid #ccc; padding-top: 10px; margin: 20px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
            .payment-info { text-align: center; margin: 20px 0; font-size: 12px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">FlokiPOS</div>
            <div class="subtitle">Point of Sale System</div>
            <div class="receipt-number">Receipt #${
              lastReceipt.receipt_number || lastReceipt.id
            }</div>
          </div>

          ${
            lastReceipt.customer_name
              ? `
            <div class="customer-info">
              <strong>Customer:</strong> ${lastReceipt.customer_name}
              ${
                lastReceipt.customer_email
                  ? `<br><strong>Email:</strong> ${lastReceipt.customer_email}`
                  : ""
              }
            </div>
          `
              : ""
          }

          <div class="items">
            <h4>Items:</h4>
            ${
              lastReceipt.items && Array.isArray(lastReceipt.items)
                ? lastReceipt.items
                    .map(
                      (item: any) => `
                <div class="item">
                  <div class="item-details">
                    <strong>${item.name}</strong> x${
                        item.quantity
                      } @ EGP ${item.price.toFixed(2)}
                  </div>
                                      <div class="item-price">EGP ${item.total.toFixed(
                                        2
                                      )}</div>
                </div>
              `
                    )
                    .join("")
                : "<p>No items found</p>"
            }
          </div>

                      <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>EGP {(lastReceipt.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax:</span>
                <span>EGP {(lastReceipt.tax || 0).toFixed(2)}</span>
              </div>
              ${
                (lastReceipt.discount || 0) > 0
                  ? `
              <div class="total-row" style="color: #059669;">
                <span>Discount:</span>
                <span>-EGP {(lastReceipt.discount || 0).toFixed(2)}</span>
              </div>
              `
                  : ""
              }
              <div class="total-row final-total">
                <span>Total:</span>
                <span>EGP {(lastReceipt.total || 0).toFixed(2)}</span>
              </div>
            </div>

          <div class="payment-info">
            <p><strong>Payment Method:</strong> ${(
              lastReceipt.payment_method || "cash"
            ).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(
              lastReceipt.created_at || Date.now()
            ).toLocaleString()}</p>
            ${
              lastReceipt.staff_name
                ? `<p><strong>Served by:</strong> ${lastReceipt.staff_name}</p>`
                : ""
            }
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Powered by FlokiPOS</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([receiptContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${lastReceipt.receipt_number || lastReceipt.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Receipt has been downloaded successfully",
    });
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(true);

      // Prepare receipt items
      const receiptItems: ReceiptItem[] = cart.map((item) => ({
        product_id: item.product_id,
        service_id: item.service_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      // Determine payment status based on payment method
      let paymentStatus:
        | "pending"
        | "completed"
        | "paid"
        | "failed"
        | "refunded" = "completed";
      if (paymentMethod === "cod") {
        paymentStatus = "pending";
      } else if (paymentMethod === "card") {
        paymentStatus = "paid";
      }

      // Prepare receipt data
      const receiptData: CreateReceiptData = {
        customer_id:
          selectedCustomer && selectedCustomer !== "walk-in"
            ? parseInt(selectedCustomer)
            : undefined,
        staff_id:
          user.role === "cashier" || user.role === "staff"
            ? user.id
            : undefined,
        subtotal: getSubtotal(),
        tax: getTax(),
        discount: getDiscount(),
        total: getTotal(),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        source: "pos", // Explicitly set source for POS transactions
        items: receiptItems,
        send_invoice: false,
        notes:
          discountValue > 0
            ? `Discount: ${
                discountType === "fixed"
                  ? `EGP ${discountValue.toFixed(2)}`
                  : `${discountValue}%`
              }`
            : undefined,
      };

      // Create receipt
      const response = await receiptService.createReceipt(receiptData);
      console.log("Receipt response:", response);

      if (response.success) {
        // The backend returns data.receipt, and items are stored as JSON string
        const receiptData: any = response.data.receipt || response.data;
        if (receiptData.items && typeof receiptData.items === "string") {
          receiptData.items = JSON.parse(receiptData.items);
        }
        setLastReceipt(receiptData);
        setShowReceipt(true);
        clearCart();

        toast({
          title: "Payment Successful",
          description: `Transaction completed: EGP ${getTotal().toFixed(2)}`,
        });
      } else {
        toast({
          title: "Payment Failed",
          description: response.message || "Failed to process payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const ReceiptDialog = () => (
    <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Receipt</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReceipt(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {lastReceipt && (
          <div
            id="receipt-content"
            className="space-y-4 bg-white p-6 rounded-lg print:shadow-none print:p-0"
          >
            {/* Branded Header */}
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-primary">
                {user.business_name || "FlokiPOS"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {user.business_name ? "Business" : "Point of Sale System"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Receipt #{lastReceipt.receipt_number || lastReceipt.id}
              </p>
              {user.role === "cashier" && (
                <p className="text-xs text-muted-foreground">
                  Cashier: {user.name}
                </p>
              )}
            </div>

            {/* Customer Info */}
            {lastReceipt.customer_name && (
              <div className="text-sm">
                <p>
                  <strong>Customer:</strong> {lastReceipt.customer_name}
                </p>
                {lastReceipt.customer_email && (
                  <p>
                    <strong>Email:</strong> {lastReceipt.customer_email}
                  </p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm border-b pb-1">Items:</h4>
              {lastReceipt.items && Array.isArray(lastReceipt.items) ? (
                lastReceipt.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">
                        x{item.quantity} @ EGP ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="font-semibold">
                      EGP {item.total.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No items found in receipt</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>EGP {(lastReceipt.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>EGP {(lastReceipt.tax || 0).toFixed(2)}</span>
              </div>
              {(lastReceipt.discount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-EGP {(lastReceipt.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>EGP {(lastReceipt.total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>
                <strong>Payment Method:</strong>{" "}
                {(lastReceipt.payment_method || "cash").toUpperCase()}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(
                  lastReceipt.created_at || Date.now()
                ).toLocaleString()}
              </p>
              {lastReceipt.staff_name && (
                <p>
                  <strong>Served by:</strong> {lastReceipt.staff_name}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4">
              <p>Thank you for your business!</p>
              <p>Powered by FlokiPOS</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4 print:hidden">
          <Button className="flex-1" onClick={() => downloadReceipt()}>
            Download PDF
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => window.print()}
          >
            Print Receipt
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => setShowReceipt(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {user?.business_name
              ? `${user.business_name} - POS`
              : "Point of Sale"}
          </h1>
          <p className="text-muted-foreground">
            {user?.business_name
              ? `Process sales for ${user.business_name}`
              : "Process sales and manage transactions"}
            {user?.role === "cashier" && (
              <span className="block text-sm text-blue-600 mt-1">
                Logged in as: {user.name} (Cashier)
              </span>
            )}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products & Services Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Products & Services</span>
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products and services..."
                      className="pl-9 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">
                      Loading products and services...
                    </span>
                  </div>
                ) : (
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger
                        value="products"
                        className="flex items-center space-x-2"
                      >
                        <span className="h-4 w-4">📦</span>
                        <span>Products ({products.length})</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="services"
                        className="flex items-center space-x-2"
                      >
                        <span className="h-4 w-4">✂️</span>
                        <span>Services ({services.length})</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        className="flex items-center space-x-2"
                      >
                        <span className="h-4 w-4">🔍</span>
                        <span>All ({products.length + services.length})</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredItems.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            <span className="text-4xl mb-2 block">📦</span>
                            <p>No products found</p>
                            <p className="text-sm">
                              {user?.role === "cashier"
                                ? "Add items manually using the button below"
                                : "Add some products to get started"}
                            </p>
                            {user?.role === "cashier" && (
                              <Button
                                onClick={() => addManualItem("product")}
                                className="mt-4"
                                variant="outline"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product Manually
                              </Button>
                            )}
                          </div>
                        ) : (
                          filteredItems.map((item) => (
                            <Card
                              key={`${item.type}-${item.id}`}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => addToCart(item)}
                            >
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <h3 className="font-semibold mb-1">
                                    {item.name}
                                  </h3>
                                  <Badge variant="secondary" className="mb-2">
                                    Product
                                  </Badge>
                                  <p className="text-lg font-bold text-primary">
                                    EGP {item.price.toFixed(2)}
                                  </p>
                                  {item.stock !== null && (
                                    <p className="text-xs text-muted-foreground">
                                      Stock: {item.stock}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="services" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredItems.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            <span className="text-4xl mb-2 block">✂️</span>
                            <p>No services found</p>
                            <p className="text-sm">
                              {user?.role === "cashier"
                                ? "Add items manually using the button below"
                                : "Add some services to get started"}
                            </p>
                            {user?.role === "cashier" && (
                              <Button
                                onClick={() => addManualItem("service")}
                                className="mt-4"
                                variant="outline"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service Manually
                              </Button>
                            )}
                          </div>
                        ) : (
                          filteredItems.map((item) => (
                            <Card
                              key={`${item.type}-${item.id}`}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => addToCart(item)}
                            >
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <h3 className="font-semibold mb-1">
                                    {item.name}
                                  </h3>
                                  <Badge variant="secondary" className="mb-2">
                                    Service
                                  </Badge>
                                  <p className="text-lg font-bold text-primary">
                                    EGP {item.price.toFixed(2)}
                                  </p>
                                  {item.duration && (
                                    <p className="text-xs text-muted-foreground">
                                      Duration: {item.duration} min
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="all" className="mt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredItems.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-muted-foreground">
                            <span className="text-4xl mb-2 block">🔍</span>
                            <p>No items found</p>
                            <p className="text-sm">
                              Add some products and services to get started
                            </p>
                          </div>
                        ) : (
                          filteredItems.map((item) => (
                            <Card
                              key={`${item.type}-${item.id}`}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => addToCart(item)}
                            >
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <h3 className="font-semibold mb-1">
                                    {item.name}
                                  </h3>
                                  <Badge variant="secondary" className="mb-2">
                                    {item.type === "product"
                                      ? "Product"
                                      : "Service"}
                                  </Badge>
                                  <p className="text-lg font-bold text-primary">
                                    ${item.price.toFixed(2)}
                                  </p>
                                  {item.type === "product" &&
                                    item.stock !== null && (
                                      <p className="text-xs text-muted-foreground">
                                        Stock: {item.stock}
                                      </p>
                                    )}
                                  {item.type === "service" && item.duration && (
                                    <p className="text-xs text-muted-foreground">
                                      Duration: {item.duration} min
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Current Sale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection - Hidden for cashiers */}
                {user?.role !== "cashier" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer</label>
                    <Select
                      value={selectedCustomer}
                      onValueChange={setSelectedCustomer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in">
                          Walk-in Customer
                        </SelectItem>
                        {customers &&
                          customers.map((customer) => (
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
                              {customer.name} - {customer.phone}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            EGP {item.price.toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Discount Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Discount</label>
                    {discountValue > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDiscountValue(0)}
                        className="h-6 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Select
                      value={discountType}
                      onValueChange={(value: "fixed" | "percentage") =>
                        setDiscountType(value)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">$</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="0.00"
                      value={discountValue || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setDiscountValue(value);
                      }}
                      className="flex-1"
                      min="0"
                      step={discountType === "fixed" ? "0.01" : "0.1"}
                    />
                  </div>

                  {discountValue > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {discountType === "fixed"
                        ? `Fixed discount: EGP ${discountValue.toFixed(2)}`
                        : `Percentage discount: ${discountValue}% (EGP ${(
                            (getSubtotal() * discountValue) /
                            100
                          ).toFixed(2)})`}
                    </div>
                  )}

                  {/* Quick Discount Buttons */}
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDiscountType("percentage");
                        setDiscountValue(5);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      5%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDiscountType("percentage");
                        setDiscountValue(10);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      10%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDiscountType("percentage");
                        setDiscountValue(15);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      15%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDiscountType("percentage");
                        setDiscountValue(20);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      20%
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>EGP {getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>EGP {getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-EGP {getDiscount().toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>EGP {getTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: any) => setPaymentMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Cash</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Card</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Mobile</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-4 w-4" />
                          <span>Other</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cod">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Cash on Delivery</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={processPayment}
                    className="w-full h-12 text-lg"
                    disabled={cart.length === 0 || processingPayment}
                  >
                    {processingPayment ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Receipt className="mr-2 h-5 w-5" />
                    )}
                    {processingPayment ? "Processing..." : "Process Payment"}
                  </Button>

                  {cart.length > 0 && (
                    <Button
                      onClick={clearCart}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ReceiptDialog />
    </div>
  );
};

export default POSInterface;
