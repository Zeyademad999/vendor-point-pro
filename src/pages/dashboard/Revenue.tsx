import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  revenueService,
  type Revenue,
  CreateRevenueData,
} from "@/services/revenue";
import { receiptService } from "@/services/receipts";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Plus,
  ShoppingBag,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
} from "lucide-react";

const Revenue = () => {
  const { toast } = useToast();
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [selectedRevenues, setSelectedRevenues] = useState<number[]>([]);
  const [revenueToDelete, setRevenueToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    category: "all",
    source: "all",
    status: "all",
    search: "",
  });

  // Form states
  const [revenueForm, setRevenueForm] = useState<CreateRevenueData>({
    title: "",
    amount: 0,
    category: "",
    source: "business",
    payment_method: "cash",
    status: "received",
    description: "",
  });

  // Constants
  const revenueCategories = [
    { value: "sales", label: "Sales" },
    { value: "services", label: "Services" },
    { value: "investments", label: "Investments" },
    { value: "grants", label: "Grants" },
    { value: "loans", label: "Loans" },
    { value: "other", label: "Other" },
  ];

  const revenueSources = [
    { value: "business", label: "Business" },
    { value: "investments", label: "Investments" },
    { value: "grants", label: "Grants" },
    { value: "loans", label: "Loans" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
  ];

  const statusOptions = [
    { value: "received", label: "Received" },
    { value: "pending", label: "Pending" },
    { value: "overdue", label: "Overdue" },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  // Add a separate effect to refresh delivered orders periodically
  useEffect(() => {
    const interval = setInterval(() => {
      loadDeliveredOrders();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Add effect to refresh data when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing data");
        loadData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadRevenue(), loadDeliveredOrders()]);
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueWithFilters = async (customFilters: any) => {
    try {
      const response = await revenueService.getRevenue(customFilters);
      if (response.success) {
        setRevenue(response.data.revenue);
      }
    } catch (error) {
      console.error("Error loading revenue:", error);
      toast({
        title: "Error",
        description: "Failed to load revenue",
        variant: "destructive",
      });
    }
  };

  const loadRevenue = async () => {
    try {
      const response = await revenueService.getRevenue(filters);
      if (response.success) {
        setRevenue(response.data.revenue);
      }
    } catch (error) {
      console.error("Error loading revenue:", error);
      toast({
        title: "Error",
        description: "Failed to load revenue",
        variant: "destructive",
      });
    }
  };

  const loadDeliveredOrders = async () => {
    try {
      console.log("Loading delivered orders...");
      const response = await receiptService.getAllReceipts();
      if (response.success) {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        console.log("All orders data:", ordersData);

        // Filter to only show delivered orders
        const delivered = ordersData.filter(
          (order: any) => order.order_status === "delivered"
        );
        console.log("Revenue: Delivered orders filtered:", delivered);
        console.log("Total delivered orders:", delivered.length);
        console.log(
          "Total delivered amount:",
          delivered.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        );
        setDeliveredOrders(delivered);
      }
    } catch (error) {
      console.error("Error loading delivered orders:", error);
    }
  };

  const refreshData = () => {
    loadData();
  };

  const handleCreateRevenue = async () => {
    // Validate form
    if (
      !revenueForm.title ||
      !revenueForm.amount ||
      !revenueForm.category ||
      !revenueForm.source
    ) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Title, Amount, Category, Source)",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await revenueService.createRevenue(revenueForm);

      if (response.success) {
        console.log("Revenue created successfully, closing dialog");
        toast({
          title: "Success",
          description: "Revenue created successfully",
        });
        setShowAddDialog(false);
        setRevenueForm({
          title: "",
          amount: 0,
          category: "",
          source: "business",
          payment_method: "cash",
          status: "received",
          description: "",
        });
        // Add a small delay to ensure backend has processed the creation
        setTimeout(() => {
          console.log("Refreshing revenue data after creation...");
          // Reset to page 1 to ensure new revenue is visible
          const newFilters = { ...filters, page: 1 };
          setFilters(newFilters);
          // Load data with the new filters
          loadRevenueWithFilters(newFilters);
        }, 500);
      } else {
        console.log("Revenue creation failed:", response);
      }
    } catch (error: any) {
      console.error("Error creating revenue:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to create revenue",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRevenue = async () => {
    if (!selectedRevenue) return;

    try {
      const response = await revenueService.updateRevenue(
        selectedRevenue.id,
        revenueForm
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Revenue updated successfully",
        });
        setShowEditDialog(false);
        setSelectedRevenue(null);
        setRevenueForm({
          title: "",
          amount: 0,
          category: "",
          source: "business",
          payment_method: "cash",
          status: "received",
          description: "",
        });
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update revenue",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRevenue = async (id: number) => {
    setRevenueToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteRevenue = async () => {
    if (!revenueToDelete) return;

    try {
      const response = await revenueService.deleteRevenue(revenueToDelete);
      if (response.success) {
        toast({
          title: "Success",
          description: "Revenue deleted successfully",
        });
        setShowDeleteDialog(false);
        setRevenueToDelete(null);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to delete revenue",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteRevenue = async () => {
    console.log("Bulk delete button clicked");
    console.log("Selected revenues:", selectedRevenues);

    if (selectedRevenues.length === 0) {
      toast({
        title: "Warning",
        description: "Please select revenue items to delete",
        variant: "destructive",
      });
      return;
    }

    console.log("Opening bulk delete dialog");
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDeleteRevenue = async () => {
    try {
      console.log("Bulk deleting revenue IDs:", selectedRevenues);
      const response = await revenueService.bulkDeleteRevenue(selectedRevenues);
      console.log("Bulk delete response:", response);
      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedRevenues.length} revenue items deleted successfully`,
        });
        setSelectedRevenues([]);
        setShowBulkDeleteDialog(false);
        loadData();
      } else {
        console.log("Bulk delete failed:", response);
        toast({
          title: "Error",
          description: response.message || "Failed to delete revenue items",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to delete revenue items",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedRevenues.length === revenue.length) {
      setSelectedRevenues([]);
    } else {
      setSelectedRevenues(revenue.map((item) => item.id));
    }
  };

  const handleSelectRevenue = (revenueId: number) => {
    setSelectedRevenues((prev) =>
      prev.includes(revenueId)
        ? prev.filter((id) => id !== revenueId)
        : [...prev, revenueId]
    );
  };

  const openEditRevenue = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setRevenueForm({
      title: revenue.title,
      amount: revenue.amount,
      category: revenue.category,
      source: revenue.source,
      payment_method: revenue.payment_method,
      status: revenue.status,
      description: revenue.description || "",
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
        return <Badge className="bg-green-100 text-green-800">Received</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryItem = revenueCategories.find((c) => c.value === category);
    return (
      <Badge variant="outline" className="text-xs">
        {categoryItem?.label || category}
      </Badge>
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceItem = revenueSources.find((s) => s.value === source);
    return (
      <Badge variant="outline" className="text-xs">
        {sourceItem?.label || source}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Revenue</h1>
          <p className="text-gray-600">Track and manage your business income</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              console.log(
                "Add Revenue button clicked, current state:",
                showAddDialog
              );
              setShowAddDialog(true);
              console.log("Set showAddDialog to true");
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Revenue
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  revenue.reduce((sum, item) => sum + item.amount, 0) +
                    deliveredOrders.reduce(
                      (sum, order) => sum + (order.total_amount || 0),
                      0
                    )
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Business Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  revenue.reduce((sum, item) => sum + item.amount, 0)
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">Manual entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders Revenue
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  deliveredOrders.reduce(
                    (sum, order) => sum + (order.total_amount || 0),
                    0
                  )
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">Delivered orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search revenue..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {revenueCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={filters.source}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, source: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {revenueSources.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() =>
                  setFilters({
                    page: 1,
                    limit: 20,
                    category: "all",
                    source: "all",
                    status: "all",
                    search: "",
                  })
                }
                variant="outline"
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Revenue</CardTitle>
            {selectedRevenues.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteRevenue}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedRevenues.length} Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={
                        selectedRevenues.length === revenue.length &&
                        revenue.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRevenues.includes(item.id)}
                        onChange={() => handleSelectRevenue(item.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(item.category)}</TableCell>
                    <TableCell>{getSourceBadge(item.source)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="capitalize">
                      {item.payment_method}
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditRevenue(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRevenue(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Revenue Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          console.log("Revenue dialog state changed:", open);
          setShowAddDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Revenue</DialogTitle>
            <DialogDescription>
              Add a new revenue entry to track your business income.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter revenue title"
                value={revenueForm.title}
                onChange={(e) =>
                  setRevenueForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (EGP)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={revenueForm.amount}
                onChange={(e) =>
                  setRevenueForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={revenueForm.category}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={revenueForm.source}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={revenueForm.payment_method}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({
                      ...prev,
                      payment_method: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={revenueForm.status}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter revenue description"
                value={revenueForm.description}
                onChange={(e) =>
                  setRevenueForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRevenue}>Add Revenue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Revenue Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Revenue</DialogTitle>
            <DialogDescription>
              Update the revenue information.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter revenue title"
                value={revenueForm.title}
                onChange={(e) =>
                  setRevenueForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-amount">Amount (EGP)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="0.00"
                value={revenueForm.amount}
                onChange={(e) =>
                  setRevenueForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={revenueForm.category}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-source">Source</Label>
                <Select
                  value={revenueForm.source}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {revenueSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-payment_method">Payment Method</Label>
                <Select
                  value={revenueForm.payment_method}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({
                      ...prev,
                      payment_method: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={revenueForm.status}
                  onValueChange={(value) =>
                    setRevenueForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter revenue description"
                value={revenueForm.description}
                onChange={(e) =>
                  setRevenueForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRevenue}>Update Revenue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Revenue</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this revenue? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRevenue}>
              Delete Revenue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={(open) => {
          console.log("Bulk delete dialog state changed:", open);
          setShowBulkDeleteDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Revenue Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedRevenues.length} revenue
              items? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDeleteRevenue}>
              Delete {selectedRevenues.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Revenue;
