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
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service";
  image?: string;
}

interface OfflineTransaction {
  id: string;
  items: CartItem[];
  customer: string;
  total: number;
  timestamp: string;
  synced: boolean;
}

const OfflinePOS: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("none");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "mobile"
  >("cash");
  const [searchTerm, setSearchTerm] = useState("");
  const [offlineTransactions, setOfflineTransactions] = useState<
    OfflineTransaction[]
  >([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Mock offline products data
  const offlineProducts = [
    {
      id: "1",
      name: "The Great Gatsby",
      price: 150,
      stock: 10,
      barcode: "1234567890123",
    },
    {
      id: "2",
      name: "1984 by George Orwell",
      price: 120,
      stock: 15,
      barcode: "1234567890124",
    },
    {
      id: "3",
      name: "To Kill a Mockingbird",
      price: 180,
      stock: 8,
      barcode: "1234567890125",
    },
    {
      id: "4",
      name: "Pride and Prejudice",
      price: 160,
      stock: 12,
      barcode: "1234567890126",
    },
    {
      id: "5",
      name: "The Catcher in the Rye",
      price: 140,
      stock: 6,
      barcode: "1234567890127",
    },
  ];

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load offline transactions from localStorage
  useEffect(() => {
    const savedTransactions = localStorage.getItem("offlineTransactions");
    if (savedTransactions) {
      setOfflineTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Save offline transactions to localStorage
  const saveOfflineTransactions = (transactions: OfflineTransaction[]) => {
    localStorage.setItem("offlineTransactions", JSON.stringify(transactions));
    setOfflineTransactions(transactions);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          type: "product" as const,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const processTransaction = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing",
        variant: "destructive",
      });
      return;
    }

    const transaction: OfflineTransaction = {
      id: `offline_${Date.now()}`,
      items: [...cart],
      customer: selectedCustomer,
      total: getTotal(),
      timestamp: new Date().toISOString(),
      synced: false,
    };

    const updatedTransactions = [...offlineTransactions, transaction];
    saveOfflineTransactions(updatedTransactions);

    toast({
      title: "Transaction Saved Offline",
      description: `Transaction saved locally. Will sync when online.`,
    });

    // Clear cart
    setCart([]);
    setSelectedCustomer("none");
  };

  const syncTransactions = async () => {
    setSyncing(true);

    // Simulate sync process
    setTimeout(() => {
      const updatedTransactions = offlineTransactions.map((t) => ({
        ...t,
        synced: true,
      }));
      saveOfflineTransactions(updatedTransactions);

      toast({
        title: "Sync Complete",
        description: `${offlineTransactions.length} transactions synced successfully`,
      });

      setSyncing(false);
      setShowSyncDialog(false);
    }, 2000);
  };

  const filteredProducts = offlineProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
  );

  const pendingSyncCount = offlineTransactions.filter((t) => !t.synced).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header with Online Status */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Offline POS</h2>
            <Badge
              variant={isOnline ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isOnline ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {!isOnline && pendingSyncCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowSyncDialog(true)}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {pendingSyncCount} Pending Sync
            </Button>
          )}
        </div>

        {!isOnline && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Transactions will be saved locally and synced when connection is
              restored.
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="w-2/3 flex flex-col border-r">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <Package className="h-8 w-8 mx-auto text-gray-400" />
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <p className="text-lg font-bold text-green-600">
                        EGP {product.price}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {product.stock}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className="w-1/3 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-sm text-gray-600">EGP {item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="font-semibold">
                      EGP {item.price * item.quantity}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {cart.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Cart is empty</p>
                <p className="text-sm">Add products to get started</p>
              </div>
            )}
          </div>

          {/* Checkout Section */}
          {cart.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={selectedCustomer}
                  onValueChange={setSelectedCustomer}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Walk-in Customer</SelectItem>
                    <SelectItem value="member">Member Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>EGP {getTotal()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>EGP {getTotal()}</span>
                </div>
              </div>

              <Button
                onClick={processTransaction}
                className="w-full"
                size="lg"
                disabled={!isOnline && pendingSyncCount > 10}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isOnline ? "Process Payment" : "Save Offline"}
              </Button>

              {!isOnline && (
                <p className="text-xs text-gray-500 text-center">
                  Transaction will be saved locally and synced when online
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sync Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Offline Transactions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">
                Pending Transactions ({pendingSyncCount})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {offlineTransactions
                  .filter((t) => !t.synced)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Transaction #{transaction.id.slice(-6)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          EGP {transaction.total}
                        </span>
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={syncTransactions}
                disabled={syncing || pendingSyncCount === 0}
                className="flex-1"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Sync {pendingSyncCount} Transactions
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSyncDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfflinePOS;
