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
  costsService,
  Cost,
  CostStats,
  CreateCostData,
} from "@/services/costs";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  TrendingDown,
  Calendar,
  DollarSign,
} from "lucide-react";

const Costs = () => {
  const { toast } = useToast();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [stats, setStats] = useState<CostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [selectedCosts, setSelectedCosts] = useState<number[]>([]);
  const [costToDelete, setCostToDelete] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    category: "all",
    status: "all",
    search: "",
  });

  // Form states
  const [costForm, setCostForm] = useState<CreateCostData>({
    title: "",
    amount: 0,
    category: "",
    payment_method: "cash",
    status: "paid",
    description: "",
  });

  // Constants
  const costCategories = [
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "salaries", label: "Salaries" },
    { value: "inventory", label: "Inventory" },
    { value: "marketing", label: "Marketing" },
    { value: "equipment", label: "Equipment" },
    { value: "maintenance", label: "Maintenance" },
    { value: "insurance", label: "Insurance" },
    { value: "taxes", label: "Taxes" },
    { value: "other", label: "Other" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "check", label: "Check" },
  ];

  const statusOptions = [
    { value: "paid", label: "Paid" },
    { value: "pending", label: "Pending" },
    { value: "overdue", label: "Overdue" },
  ];

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCosts(), loadStats()]);
    } catch (error) {
      console.error("Error loading costs data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCosts = async () => {
    try {
      const response = await costsService.getCosts(filters);
      if (response.success) {
        setCosts(response.data.costs);
      }
    } catch (error) {
      console.error("Error loading costs:", error);
      toast({
        title: "Error",
        description: "Failed to load costs",
        variant: "destructive",
      });
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await costsService.getCostStats("30");
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading cost stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateCost = async () => {
    // Validate form
    if (!costForm.title || !costForm.amount || !costForm.category) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (Title, Amount, Category)",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await costsService.createCost(costForm);

      if (response.success) {
        console.log("Cost created successfully, closing dialog");
        toast({
          title: "Success",
          description: "Cost created successfully",
        });
        setShowAddDialog(false);
        setCostForm({
          title: "",
          amount: 0,
          category: "",
          payment_method: "cash",
          status: "paid",
          description: "",
        });
        // Add a small delay to ensure backend has processed the creation
        setTimeout(() => {
          console.log("Refreshing costs data after creation...");
          loadData();
        }, 500);
      } else {
        console.log("Cost creation failed:", response);
      }
    } catch (error: any) {
      console.error("Error creating cost:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create cost",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCost = async () => {
    if (!selectedCost) return;

    try {
      const response = await costsService.updateCost(selectedCost.id, costForm);
      if (response.success) {
        toast({
          title: "Success",
          description: "Cost updated successfully",
        });
        setShowEditDialog(false);
        setSelectedCost(null);
        setCostForm({
          title: "",
          amount: 0,
          category: "",
          payment_method: "cash",
          status: "paid",
          description: "",
        });
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update cost",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCost = async (id: number) => {
    setCostToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCost = async () => {
    if (!costToDelete) return;

    try {
      const response = await costsService.deleteCost(costToDelete);
      if (response.success) {
        toast({
          title: "Success",
          description: "Cost deleted successfully",
        });
        setShowDeleteDialog(false);
        setCostToDelete(null);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete cost",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteCosts = async () => {
    if (selectedCosts.length === 0) {
      toast({
        title: "Warning",
        description: "Please select costs to delete",
        variant: "destructive",
      });
      return;
    }

    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDeleteCosts = async () => {
    try {
      const response = await costsService.bulkDeleteCosts(selectedCosts);
      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedCosts.length} costs deleted successfully`,
        });
        setSelectedCosts([]);
        setShowBulkDeleteDialog(false);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete costs",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedCosts.length === costs.length) {
      setSelectedCosts([]);
    } else {
      setSelectedCosts(costs.map((cost) => cost.id));
    }
  };

  const handleSelectCost = (costId: number) => {
    setSelectedCosts((prev) =>
      prev.includes(costId)
        ? prev.filter((id) => id !== costId)
        : [...prev, costId]
    );
  };

  const openEditCost = (cost: Cost) => {
    setSelectedCost(cost);
    setCostForm({
      title: cost.title,
      amount: cost.amount,
      category: cost.category,
      payment_method: cost.payment_method,
      status: cost.status,
      description: cost.description || "",
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryItem = costCategories.find((c) => c.value === category);
    return (
      <Badge variant="outline" className="text-xs">
        {categoryItem?.label || category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Costs</h1>
          <p className="text-gray-600">
            Track and manage your business expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadData()}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              console.log(
                "Add Cost button clicked, current state:",
                showAddDialog
              );
              setShowAddDialog(true);
              console.log("Set showAddDialog to true");
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Cost
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(stats?.allTimeTotalCosts || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  stats?.allTimeCostsByStatus.find((s) => s.status === "paid")
                    ?.total || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Costs</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  stats?.allTimeCostsByStatus.find(
                    (s) => s.status === "pending"
                  )?.total || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
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
                  placeholder="Search costs..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      search: e.target.value,
                      page: 1,
                    }))
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
                  setFilters((prev) => ({ ...prev, category: value, page: 1 }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {costCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
                  setFilters((prev) => ({ ...prev, status: value, page: 1 }))
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

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Costs</CardTitle>
            {selectedCosts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteCosts}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete {selectedCosts.length} Selected
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
                        selectedCosts.length === costs.length &&
                        costs.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedCosts.includes(cost.id)}
                        onChange={() => handleSelectCost(cost.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{cost.title}</p>
                        {cost.description && (
                          <p className="text-sm text-gray-600">
                            {cost.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(cost.category)}</TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(cost.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(cost.status)}</TableCell>
                    <TableCell className="capitalize">
                      {cost.payment_method}
                    </TableCell>
                    <TableCell>{formatDate(cost.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditCost(cost)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCost(cost.id)}
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

      {/* Add Cost Dialog */}
      {console.log("Rendering cost dialog with showAddDialog:", showAddDialog)}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          console.log("Cost dialog state changed:", open);
          setShowAddDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Cost</DialogTitle>
            <DialogDescription>
              Add a new business expense to track your costs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter cost title"
                value={costForm.title}
                onChange={(e) =>
                  setCostForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (EGP)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={costForm.amount}
                onChange={(e) =>
                  setCostForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={costForm.category}
                onValueChange={(value) =>
                  setCostForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {costCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={costForm.payment_method}
                  onValueChange={(value) =>
                    setCostForm((prev) => ({ ...prev, payment_method: value }))
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
                  value={costForm.status}
                  onValueChange={(value) =>
                    setCostForm((prev) => ({ ...prev, status: value }))
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
                placeholder="Enter cost description"
                value={costForm.description}
                onChange={(e) =>
                  setCostForm((prev) => ({
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
            <Button onClick={handleCreateCost}>Add Cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Cost Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Cost</DialogTitle>
            <DialogDescription>Update the cost information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="Enter cost title"
                value={costForm.title}
                onChange={(e) =>
                  setCostForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-amount">Amount (EGP)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="0.00"
                value={costForm.amount}
                onChange={(e) =>
                  setCostForm((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={costForm.category}
                onValueChange={(value) =>
                  setCostForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {costCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-payment_method">Payment Method</Label>
                <Select
                  value={costForm.payment_method}
                  onValueChange={(value) =>
                    setCostForm((prev) => ({ ...prev, payment_method: value }))
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
                  value={costForm.status}
                  onValueChange={(value) =>
                    setCostForm((prev) => ({ ...prev, status: value }))
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
                placeholder="Enter cost description"
                value={costForm.description}
                onChange={(e) =>
                  setCostForm((prev) => ({
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
            <Button onClick={handleUpdateCost}>Update Cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cost</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cost? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCost}>
              Delete Cost
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Costs</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCosts.length} cost items?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDeleteCosts}>
              Delete {selectedCosts.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Costs;
