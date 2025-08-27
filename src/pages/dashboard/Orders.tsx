import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { receiptService } from "@/services/receipts";
import {
  Search,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Truck,
  Loader2,
  ShoppingBag,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Order {
  id: number;
  receipt_number: string;
  client_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  items: string | any[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  updated_at: string;
  source: "pos" | "website";
  notes?: string;
}

interface OrderStats {
  pendingOrders: number;
  expectedCash: number;
  collectedCash: number;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pendingOrders: 0,
    expectedCash: 0,
    collectedCash: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [deletingOrder, setDeletingOrder] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
    loadOrderStats();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  useEffect(() => {
    // Update select all checkbox
    if (filteredOrders.length > 0) {
      setSelectAll(selectedOrders.length === filteredOrders.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedOrders, filteredOrders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await receiptService.getAllReceipts();
      if (response.success) {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        console.log("Orders: All orders loaded:", ordersData);
        // Debug: Log the first order to see its structure
        if (ordersData.length > 0) {
          console.log("Orders: First order structure:", ordersData[0]);
          console.log("Orders: First order source:", ordersData[0].source);
        }
        // Filter to only show website orders (source = "website")
        const websiteOrders = ordersData.filter(
          (order: Order) => order.source === "website"
        );
        console.log("Orders: Website orders filtered:", websiteOrders);
        setOrders(websiteOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading website orders:", error);
      toast({
        title: "Error",
        description: "Failed to load website orders",
        variant: "destructive",
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      setStatsLoading(true);
      // Pass source=website to get stats only for website orders
      const response = await receiptService.getOrderStats({
        source: "website",
      });
      console.log("Orders: Order stats response:", response);
      if (response.success) {
        console.log("Orders: Setting order stats:", response.data);
        setOrderStats(response.data);
      }
    } catch (error) {
      console.error("Error loading order stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    console.log("Orders: Starting filter with orders:", filtered);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.receipt_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log("Orders: After search filter:", filtered);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.order_status === statusFilter
      );
      console.log("Orders: After status filter:", filtered);
    }

    // Payment method filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.payment_method === paymentFilter
      );
      console.log("Orders: After payment filter:", filtered);
    }

    console.log("Orders: Final filtered orders:", filtered);
    setFilteredOrders(filtered);
  };

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingStatus(true);
      const response = await receiptService.updateReceiptStatus(
        orderId,
        status,
        "completed" // Payment status remains completed
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `Order status updated to ${status}`,
        });
        loadOrders();
        loadOrderStats(); // Reload stats to update revenue (will use website source)
        setShowStatusDialog(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      setDeletingOrder(orderId);
      const response = await receiptService.deleteReceipt(orderId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Order deleted successfully",
        });
        loadOrders();
        loadOrderStats();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setDeletingOrder(null);
    }
  };

  const bulkDeleteOrders = async () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Warning",
        description: "Please select orders to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      setBulkDeleting(true);
      const response = await receiptService.bulkDeleteOrders(selectedOrders);
      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedOrders.length} orders deleted successfully`,
        });
        setSelectedOrders([]);
        loadOrders();
        loadOrderStats();
      }
    } catch (error: any) {
      console.error("Error bulk deleting orders:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete orders";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const cleanupTestOrders = async () => {
    try {
      setBulkDeleting(true);
      const response = await receiptService.cleanupTestOrders();
      if (response.success) {
        toast({
          title: "Success",
          description: "Test orders cleaned up successfully",
        });
        setSelectedOrders([]);
        loadOrders();
        loadOrderStats();
      }
    } catch (error) {
      console.error("Error cleaning up test orders:", error);
      toast({
        title: "Error",
        description: "Failed to cleanup test orders",
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1"
          >
            <Clock className="w-2 h-2 mr-1" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 text-xs px-2 py-1"
          >
            <Loader2 className="w-2 h-2 mr-1" />
            In Progress
          </Badge>
        );
      case "shipped":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 text-xs px-2 py-1"
          >
            <Package className="w-2 h-2 mr-1" />
            Shipped
          </Badge>
        );
      case "out_for_delivery":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-800 text-xs px-2 py-1"
          >
            <Truck className="w-2 h-2 mr-1" />
            Out for Delivery
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 text-xs px-2 py-1"
          >
            <CheckCircle className="w-2 h-2 mr-1" />
            Delivered
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="text-xs px-2 py-1">
            <AlertCircle className="w-2 h-2 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs px-2 py-1">
            {status}
          </Badge>
        );
    }
  };

  const getPaymentBadge = (method: string, status: string) => {
    if (method === "card") {
      return (
        <Badge
          variant="default"
          className="bg-blue-100 text-blue-800 text-xs px-2 py-1"
        >
          <CreditCard className="w-2 h-2 mr-1" />
          Card
        </Badge>
      );
    } else if (method === "cod") {
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 text-xs px-2 py-1"
        >
          <DollarSign className="w-2 h-2 mr-1" />
          COD
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs px-2 py-1">
          <DollarSign className="w-2 h-2 mr-1" />
          {method}
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parseItems = (items: string | any[]) => {
    if (typeof items === "string") {
      try {
        return JSON.parse(items);
      } catch {
        return [];
      }
    }
    return items || [];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Website Orders</h1>
          <p className="text-gray-600">Manage and track website orders</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <Button
              onClick={bulkDeleteOrders}
              disabled={bulkDeleting}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {bulkDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Selected ({selectedOrders.length})
            </Button>
          )}
          <Button
            onClick={cleanupTestOrders}
            disabled={bulkDeleting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clean Test Orders
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </p>
              <p className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  orderStats.pendingOrders
                )}
              </p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expected Cash
              </p>
              <p className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(orderStats.expectedCash)
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Collected Cash
              </p>
              <p className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(orderStats.collectedCash)
                )}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h3 className="font-medium">Filters</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium">Search</label>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="out_for_delivery">
                  Out for Delivery
                </SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium">Payment</label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cod">COD</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Orders ({filteredOrders.length})</h3>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 p-2">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="p-2 text-xs">Order #</TableHead>
                  <TableHead className="p-2 text-xs">Customer</TableHead>
                  <TableHead className="p-2 text-xs">Items</TableHead>
                  <TableHead className="p-2 text-xs">Total</TableHead>
                  <TableHead className="p-2 text-xs">Status</TableHead>
                  <TableHead className="p-2 text-xs">Payment</TableHead>
                  <TableHead className="p-2 text-xs">Date</TableHead>
                  <TableHead className="p-2 text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const items = parseItems(order.items);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="p-2">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell className="p-2 text-xs font-medium">
                        {order.receipt_number}
                      </TableCell>
                      <TableCell className="p-2">
                        <div>
                          <div className="text-xs font-medium">
                            {order.customer_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.customer_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="p-2 text-xs font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell className="p-2">
                        {getStatusBadge(order.order_status)}
                      </TableCell>
                      <TableCell className="p-2">
                        {getPaymentBadge(
                          order.payment_method,
                          order.payment_status
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-xs">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.order_status);
                              setShowStatusDialog(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => deleteOrder(order.id)}
                            disabled={deletingOrder === order.id}
                          >
                            {deletingOrder === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - {selectedOrder?.receipt_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Number:</span>
                      <span className="font-medium">
                        {selectedOrder.receipt_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedOrder.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedOrder.order_status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span>
                        {getPaymentBadge(
                          selectedOrder.payment_method,
                          selectedOrder.payment_status
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium capitalize">
                        {selectedOrder.source}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {selectedOrder.customer_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                    {selectedOrder.customer_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <span>{selectedOrder.customer_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseItems(selectedOrder.items).map(
                        (item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell>{formatCurrency(item.price)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 text-right">
                  <div className="text-lg font-semibold">
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-3">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="out_for_delivery">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateOrderStatus(selectedOrder!.id, newStatus)}
                disabled={updatingStatus || !newStatus}
              >
                {updatingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
