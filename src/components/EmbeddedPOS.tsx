import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface EmbeddedPOSProps {
  onTransactionComplete?: (receipt: any) => void;
}

const EmbeddedPOS: React.FC<EmbeddedPOSProps> = ({ onTransactionComplete }) => {
  const { toast } = useToast();

  // State management
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile" | "other"
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
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Data state
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter items based on search term and active tab
  useEffect(() => {
    let items: any[] = [];

    if (activeTab === "products") {
      items = (products || []).map((p) => ({ ...p, type: "product" as const }));
    } else if (activeTab === "services") {
      items = (services || []).map((s) => ({ ...s, type: "service" as const }));
    } else {
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

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsResponse, servicesResponse, customersResponse] =
        await Promise.all([
          productService.getProducts({ limit: 100 }),
          serviceService.getServices({ limit: 100 }),
          customerService.getCustomers({ limit: 100 }),
        ]);

      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
      } else {
        setProducts([]);
      }

      if (servicesResponse.success) {
        setServices(servicesResponse.data || []);
      } else {
        setServices([]);
      }

      if (customersResponse.success) {
        setCustomers(customersResponse.data || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setProducts([]);
      setServices([]);
      setCustomers([]);
      toast({
        title: "Error",
        description: "Failed to load products, services, and customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: any) => {
    const existingItem = cart.find(
      (cartItem) => cartItem.id === `${item.type}-${item.id}`
    );

    if (existingItem) {
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
            if (newQuantity <= 0) {
              return null;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("none");
    setPaymentMethod("cash");
    setDiscountValue(0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.1; // 10% tax
  };

  const getDiscount = () => {
    if (discountType === "fixed") {
      return Math.min(discountValue, getSubtotal());
    } else {
      return (getSubtotal() * discountValue) / 100;
    }
  };

  const getTotal = () => {
    return getSubtotal() + getTax() - getDiscount();
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingPayment(true);

      const receiptItems: ReceiptItem[] = cart.map((item) => ({
        product_id: item.product_id,
        service_id: item.service_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
      }));

      const receiptData: CreateReceiptData = {
        customer_id:
          selectedCustomer === "none" ? null : parseInt(selectedCustomer),
        items: receiptItems,
        subtotal: getSubtotal(),
        tax: getTax(),
        discount: getDiscount(),
        total: getTotal(),
        payment_method: paymentMethod,
      };

      const response = await receiptService.createReceipt(receiptData);

      if (response.success) {
        const receiptData: any = response.data.receipt || response.data;
        if (receiptData.items && typeof receiptData.items === "string") {
          receiptData.items = JSON.parse(receiptData.items);
        }

        setLastReceipt(receiptData);
        setShowReceipt(true);

        toast({
          title: "Payment Successful",
          description: `Transaction completed: $${getTotal().toFixed(2)}`,
        });

        if (onTransactionComplete) {
          onTransactionComplete(receiptData);
        }
      } else {
        toast({
          title: "Payment Failed",
          description: response.message || "Failed to process payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const downloadReceipt = () => {
    if (!lastReceipt) return;

    const receiptText = `
FlokiPOS Receipt
================

Receipt #: ${lastReceipt.receipt_number || lastReceipt.id}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
${lastReceipt.customer_name ? `Customer: ${lastReceipt.customer_name}` : ""}
${lastReceipt.customer_email ? `Email: ${lastReceipt.customer_email}` : ""}
Payment Method: ${lastReceipt.payment_method || paymentMethod}

Items:
${cart
  .map(
    (item) =>
      `  ${item.name} x ${item.quantity} - $${(
        item.price * item.quantity
      ).toFixed(2)}`
  )
  .join("\n")}

Subtotal: $${lastReceipt.subtotal?.toFixed(2) || getSubtotal().toFixed(2)}
Tax: $${lastReceipt.tax?.toFixed(2) || getTax().toFixed(2)}
Discount: -$${lastReceipt.discount?.toFixed(2) || getDiscount().toFixed(2)}
Total: $${lastReceipt.total?.toFixed(2)}

Payment Status: Completed
Transaction ID: ${lastReceipt.id}

Thank you for your business!
FlokiPOS - Professional Point of Sale System
    `;

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${lastReceipt.receipt_number || lastReceipt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading POS...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <ShoppingCart className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Point of Sale</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{cart.length} items</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            disabled={cart.length === 0}
          >
            Clear Cart
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products/Services */}
        <div className="w-2/3 flex flex-col border-r">
          {/* Search and Tabs */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products and services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products" className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center">
                  <Scissors className="h-4 w-4 mr-2" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={`${item.type}-${item.id}`}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        {item.type === "product" ? (
                          <Package className="h-6 w-6 text-gray-600" />
                        ) : (
                          <Scissors className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <h3 className="font-medium text-sm mb-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-green-600">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                        {item.type === "product" && item.stock !== null && (
                          <Badge variant="outline" className="text-xs">
                            {item.stock} in stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart & Payment */}
        <div className="w-1/3 flex flex-col">
          <div className="p-4 space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cart ({cart.length})</h3>
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Cart is empty</p>
                <p className="text-sm">Add items to get started</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Customer</label>
              <Select
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Method
              </label>
              <Select
                value={paymentMethod}
                onValueChange={(value: any) => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="mobile">Mobile Payment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Discount Type
                </label>
                <Select
                  value={discountType}
                  onValueChange={(value: any) => setDiscountType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Discount Value
                </label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) =>
                    setDiscountValue(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>-${getDiscount().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Process Payment Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={processPayment}
              disabled={cart.length === 0 || processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Receipt</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReceipt(false);
                  clearCart();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Branded Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold text-primary">FlokiPOS</h2>
                <p className="text-sm text-muted-foreground">
                  Point of Sale System
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Receipt #{lastReceipt.receipt_number || lastReceipt.id}
                </p>
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
                          x{item.quantity} @ ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <span className="font-semibold">
                        ${item.total.toFixed(2)}
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
                  <span>${(lastReceipt.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${(lastReceipt.tax || 0).toFixed(2)}</span>
                </div>
                {(lastReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${(lastReceipt.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${(lastReceipt.total || 0).toFixed(2)}</span>
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

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4">
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
                  onClick={() => {
                    setShowReceipt(false);
                    clearCart();
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedPOS;
