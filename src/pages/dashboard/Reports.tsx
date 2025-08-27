import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Loader2,
  FileText,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  BarChart,
  LineChart,
  Download as DownloadIcon,
  Calendar as CalendarIcon,
  Settings,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { reportService, ReportData, TransactionData } from "@/services/reports";

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "excel">(
    "pdf"
  );
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Transaction management states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
    []
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    number | null
  >(null);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const filters = {
          dateRange,
          reportType,
          ...(customDateRange.startDate &&
            customDateRange.endDate && {
              startDate: customDateRange.startDate,
              endDate: customDateRange.endDate,
            }),
        };

        const response = await reportService.getReports(filters);

        if (response.success) {
          setReportData(response.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch report data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch report data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchReportData();
    }
  }, [dateRange, reportType, customDateRange, isAuthenticated, toast]);

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      const filters = {
        dateRange,
        reportType,
        ...(customDateRange.startDate &&
          customDateRange.endDate && {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate,
          }),
      };

      const response = await reportService.exportReport(filters, exportFormat);

      if (response.success) {
        // For PDF, the response is already a blob
        if (exportFormat === "pdf") {
          const blob = new Blob([response.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-${
            new Date().toISOString().split("T")[0]
          }.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // For CSV and Excel, create download link
          const blob = new Blob([response.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-${
            new Date().toISOString().split("T")[0]
          }.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }

        toast({
          title: "Export Successful",
          description: `Report exported as ${exportFormat.toUpperCase()}`,
        });
      } else {
        toast({
          title: "Export Failed",
          description: "Failed to export report",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomDateRange = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setDateRange("custom");
      setIsCustomDateOpen(false);
    }
  };

  // Transaction management functions
  const loadTransactions = async (page: number = 1) => {
    try {
      setTransactionsLoading(true);
      const filters = {
        page,
        limit: 10,
        search: searchTerm,
        dateRange,
        ...(customDateRange.startDate &&
          customDateRange.endDate && {
            startDate: customDateRange.startDate,
            endDate: customDateRange.endDate,
          }),
      };

      const response = await reportService.getTransactions(filters);
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.pages);
        setTotalTransactions(response.data.pagination.total);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleEditTransaction = (transaction: TransactionData) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async (
    updatedData: Partial<TransactionData>
  ) => {
    if (!editingTransaction) return;

    try {
      const response = await reportService.updateTransaction(
        editingTransaction.id,
        updatedData
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingTransaction(null);
        loadTransactions(currentPage);
      } else {
        toast({
          title: "Error",
          description: "Failed to update transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = (transactionId: number) => {
    setDeletingTransactionId(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransactionId) return;

    try {
      const response = await reportService.deleteTransaction(
        deletingTransactionId
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
        setIsDeleteDialogOpen(false);
        setDeletingTransactionId(null);
        loadTransactions(currentPage);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;

    try {
      const response = await reportService.bulkDeleteTransactions(
        selectedTransactions
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `${selectedTransactions.length} transactions deleted successfully`,
        });
        setSelectedTransactions([]);
        loadTransactions(currentPage);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete transactions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error bulk deleting transactions:", error);
      toast({
        title: "Error",
        description: "Failed to delete transactions",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (transactionId: number) => {
    setSelectedTransactions((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAllTransactions = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map((t) => t.id));
    }
  };

  // Load transactions when tab changes or filters change
  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions(1);
    }
  }, [activeTab, searchTerm, dateRange, customDateRange]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "pending":
        return "bg-warning text-warning-foreground";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? "text-success" : "text-destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading reports...</span>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No data available</h3>
          <p className="text-muted-foreground">
            Reports will appear here once you have data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Advanced business insights and performance tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {/* Custom Date Range Dialog */}
          <Dialog open={isCustomDateOpen} onOpenChange={setIsCustomDateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Custom
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Custom Date Range</DialogTitle>
                <DialogDescription>
                  Select a custom date range for your reports
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) =>
                        setCustomDateRange({
                          ...customDateRange,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) =>
                        setCustomDateRange({
                          ...customDateRange,
                          endDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleCustomDateRange} className="w-full">
                  Apply Date Range
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Options */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Report</DialogTitle>
                <DialogDescription>
                  Choose the format and export your report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(value: "pdf" | "csv" | "excel") =>
                      setExportFormat(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="csv">CSV Data</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleExportReport}
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="products">Products & Services</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.totalSales)}
                </div>
                <p
                  className={`text-xs flex items-center ${getGrowthColor(12)}`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatPercentage(12)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalOrders}
                </div>
                <p className={`text-xs flex items-center ${getGrowthColor(8)}`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatPercentage(8)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Customers
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalCustomers}
                </div>
                <p
                  className={`text-xs flex items-center ${getGrowthColor(15)}`}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatPercentage(15)} from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Bookings
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalBookings}
                </div>
                <p
                  className={`text-xs flex items-center ${getGrowthColor(-3)}`}
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {formatPercentage(-3)} from last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key business performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Order Value</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      reportData.totalSales /
                        Math.max(reportData.totalOrders, 1)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Customer Retention Rate</span>
                  <span className="font-semibold text-success">85%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="font-semibold text-success">12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Revenue per Customer</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      reportData.totalSales /
                        Math.max(reportData.totalCustomers, 1)
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Top Products
                </CardTitle>
                <CardDescription>
                  Best selling products by revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topProducts.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.quantity} sold
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatCurrency(product.sales)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Top Services
                </CardTitle>
                <CardDescription>
                  Most popular services by bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topServices.slice(0, 5).map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.bookings} bookings
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">
                        {formatCurrency(service.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest sales and bookings activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.recentTransactions
                  .slice(0, 10)
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === "sale"
                              ? "bg-primary/10"
                              : "bg-secondary/10"
                          }`}
                        >
                          {transaction.type === "sale" ? (
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          ) : (
                            <Calendar className="h-4 w-4 text-secondary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.customer}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.id} • {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Sales Trend
                </CardTitle>
                <CardDescription>Monthly sales performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.salesByMonth.map((month, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${
                                (month.sales /
                                  Math.max(
                                    ...reportData.salesByMonth.map(
                                      (m) => m.sales
                                    )
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-20 text-right">
                          {formatCurrency(month.sales)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Revenue Breakdown
                </CardTitle>
                <CardDescription>Revenue by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Product Sales</span>
                    <span className="font-semibold">
                      {formatCurrency(reportData.totalSales * 0.65)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Service Bookings</span>
                    <span className="font-semibold">
                      {formatCurrency(reportData.totalSales * 0.35)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online Orders</span>
                    <span className="font-semibold">
                      {formatCurrency(reportData.totalSales * 0.25)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">POS Transactions</span>
                    <span className="font-semibold">
                      {formatCurrency(reportData.totalSales * 0.75)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Business Performance
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Revenue Growth
                      </span>
                      <span className="text-sm text-success">+12.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Customer Satisfaction
                      </span>
                      <span className="text-sm text-success">4.8/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: "96%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Order Completion Rate
                      </span>
                      <span className="text-sm text-success">98.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{ width: "98.5%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        Staff Productivity
                      </span>
                      <span className="text-sm text-warning">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-warning h-2 rounded-full"
                        style={{ width: "85%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Time-based Metrics
                </CardTitle>
                <CardDescription>Performance over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">2.3</div>
                    <div className="text-sm text-muted-foreground">
                      Avg. Orders/Day
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-secondary">45</div>
                    <div className="text-sm text-muted-foreground">
                      Avg. Minutes/Order
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-success">1.8</div>
                    <div className="text-sm text-muted-foreground">
                      Avg. Items/Order
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-warning">12</div>
                    <div className="text-sm text-muted-foreground">
                      Peak Hours/Day
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Customer Insights
                </CardTitle>
                <CardDescription>
                  Customer behavior and demographics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Customers</span>
                  <span className="font-semibold text-success">+25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Returning Customers</span>
                  <span className="font-semibold">180</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Customer Lifetime Value</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      (reportData.totalSales /
                        Math.max(reportData.totalCustomers, 1)) *
                        12
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Churn Rate</span>
                  <span className="font-semibold text-success">2.1%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Customer Segments
                </CardTitle>
                <CardDescription>
                  Customer distribution by value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Value (&gt;EGP 1000)</span>
                    <span className="font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Medium Value (EGP 500-1000)</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Value (&lt;EGP 500)</span>
                    <span className="font-semibold">40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products & Services Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Performance
                </CardTitle>
                <CardDescription>Top performing products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topProducts.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(product.sales)}
                        </p>
                        <p className="text-xs text-success">
                          +{Math.floor(Math.random() * 20 + 10)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Service Performance
                </CardTitle>
                <CardDescription>Most popular services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.topServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.bookings} bookings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(service.revenue)}
                        </p>
                        <p className="text-xs text-success">
                          +{Math.floor(Math.random() * 15 + 5)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Transaction Management Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Transaction Management</h2>
              <p className="text-muted-foreground">
                Manage and analyze all transactions with CRUD operations
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {selectedTransactions.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedTransactions.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTransactions(currentPage)}
                disabled={transactionsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    transactionsLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Transaction Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search Transactions</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by customer, receipt number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => loadTransactions(1)}
                    disabled={transactionsLoading}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Transactions</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {transactions.length} of {totalTransactions}{" "}
                  transactions
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={
                              selectedTransactions.length ===
                                transactions.length && transactions.length > 0
                            }
                            onChange={handleSelectAllTransactions}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>Receipt #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedTransactions.includes(
                                  transaction.id
                                )}
                                onChange={() =>
                                  handleSelectTransaction(transaction.id)
                                }
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {transaction.receipt_number}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {transaction.customer_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.customer_email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="text-sm">
                                  {Array.isArray(transaction.items)
                                    ? transaction.items.length
                                    : "N/A"}{" "}
                                  items
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {Array.isArray(transaction.items)
                                    ? transaction.items
                                        .map((item: any) => item.name)
                                        .join(", ")
                                    : "Items not available"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(transaction.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {transaction.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusColor(
                                  transaction.payment_status
                                )}
                              >
                                {transaction.payment_status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleEditTransaction(transaction)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteTransaction(transaction.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTransactions(currentPage - 1)}
                      disabled={currentPage === 1 || transactionsLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadTransactions(currentPage + 1)}
                      disabled={
                        currentPage === totalPages || transactionsLoading
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Transaction Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>Update transaction details</DialogDescription>
            </DialogHeader>
            {editingTransaction && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input
                    value={editingTransaction.customer_name}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer Email</Label>
                  <Input
                    value={editingTransaction.customer_email}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        customer_email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select
                    value={editingTransaction.payment_status}
                    onValueChange={(value) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        payment_status: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={editingTransaction.notes || ""}
                    onChange={(e) =>
                      setEditingTransaction({
                        ...editingTransaction,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add notes about this transaction..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleUpdateTransaction(editingTransaction)}
                  >
                    Update Transaction
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transaction? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTransaction}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tabs>
    </div>
  );
};

export default Reports;
