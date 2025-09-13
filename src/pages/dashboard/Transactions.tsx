import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import RefundScanner from "@/components/RefundScanner";
import { receiptService } from "@/services/receipts";
import { reportService, TransactionData } from "@/services/reports";
import {
  Search,
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  Package,
  CheckCircle,
  Download,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction extends TransactionData {
  client_id?: number;
  customer_address?: string;
}

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [itemsPerPage] = useState(10);

  // CRUD operation states
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>(
    []
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    number | null
  >(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadTransactions();
  }, [currentPage, searchTerm, sourceFilter, paymentFilter, dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      console.log("Transactions: Loading POS transactions for user:", user);

      // Use the reports service for better pagination and filtering
      // Only fetch POS transactions (source = "pos")
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        dateRange: dateFilter === "all" ? "30" : dateFilter,
        source: "pos", // Only POS transactions
        ...(paymentFilter !== "all" && { paymentMethod: paymentFilter }),
      };

      const response = await reportService.getTransactions(filters);

      if (response.success && response.data) {
        const transactionsData = response.data.transactions;
        console.log(
          "Transactions: POS transactions API response:",
          transactionsData
        );

        // Debug: Log each transaction's status
        transactionsData.forEach((receipt: Transaction, index: number) => {
          console.log(`Transaction ${index + 1}:`, {
            id: receipt.id,
            receipt_number: receipt.receipt_number,
            payment_status: receipt.payment_status,
            order_status: receipt.order_status,
            source: receipt.source,
            total_amount: receipt.total_amount,
          });
        });

        // Backend now handles the filtering, so we can use all returned transactions
        console.log(
          "Transactions: POS transactions from backend:",
          transactionsData
        );
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
        setTotalPages(response.data.pagination.pages);
        setTotalTransactions(response.data.pagination.total);
      } else {
        console.log("Transactions: API failed:", response);
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error) {
      console.error("Error loading POS transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load POS transactions",
        variant: "destructive",
      });
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async (updatedData: Partial<Transaction>) => {
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
        loadTransactions();
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
        loadTransactions();
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
        loadTransactions();
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
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map((t) => t.id));
    }
  };

  const getPaymentBadge = (method: string) => {
    if (method === "card") {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <CreditCard className="w-3 h-3 mr-1" />
          Card
        </Badge>
      );
    } else if (method === "cod") {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          COD Collected
        </Badge>
      );
    }
    return <Badge variant="outline">{method}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    return source === "pos" ? (
      <Badge variant="outline" className="bg-purple-100 text-purple-800">
        POS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
        Website
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseItems = (itemsString: string | any[]) => {
    try {
      console.log("Parsing items:", itemsString);
      let items;
      if (typeof itemsString === "string") {
        items = JSON.parse(itemsString);
      } else if (Array.isArray(itemsString)) {
        items = itemsString;
      } else {
        console.error("Items is neither string nor array:", itemsString);
        return 0;
      }
      console.log("Parsed items:", items);
      return items.length;
    } catch (error) {
      console.error("Error parsing items:", error);
      return 0;
    }
  };

  const getItemsList = (itemsString: string | any[]) => {
    try {
      console.log("Getting items list for:", itemsString);
      let items;
      if (typeof itemsString === "string") {
        items = JSON.parse(itemsString);
      } else if (Array.isArray(itemsString)) {
        items = itemsString;
      } else {
        console.error("Items is neither string nor array:", itemsString);
        return "Items not available";
      }
      console.log("Items for list:", items);
      return items
        .map((item: any) => `${item.name} (${item.quantity})`)
        .join(", ");
    } catch (error) {
      console.error("Error getting items list:", error);
      return "Items not available";
    }
  };

  const totalRevenue = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.total_amount || 0),
    0
  );
  const cardTransactions = filteredTransactions.filter(
    (t) => t.payment_method === "card"
  ).length;
  const codTransactions = filteredTransactions.filter(
    (t) => t.payment_method === "cod"
  ).length;
  const posTransactions = filteredTransactions.filter(
    (t) => t.source === "pos"
  ).length;
  const websiteTransactions = filteredTransactions.filter(
    (t) => t.source === "website"
  ).length;

  const averageTransactionValue =
    filteredTransactions.length > 0
      ? totalRevenue / filteredTransactions.length
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            POS Transactions
          </h1>
          <p className="text-muted-foreground">
            View all POS transactions from admin, staff, and cashier portals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedTransactions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedTransactions.length})
            </Button>
          )}
          <RefundScanner />
          <Button variant="outline" size="sm" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EGP {totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Transaction
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              EGP {averageTransactionValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cardTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              COD Collections
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{codTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              POS Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{posTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Website Orders
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{websiteTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
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
              Showing {filteredTransactions.length} of {totalTransactions}{" "}
              transactions
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedTransactions.length ===
                          filteredTransactions.length &&
                        filteredTransactions.length > 0
                      }
                      onChange={handleSelectAllTransactions}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
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
                          <div className="text-xs text-muted-foreground">
                            {transaction.customer_phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm font-medium">
                            {parseItems(transaction.items)} items
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {getItemsList(transaction.items)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        EGP {(transaction.total_amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getPaymentBadge(transaction.payment_method)}
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(transaction.source)}
                      </TableCell>
                      <TableCell>
                        {formatDate(transaction.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
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
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default Transactions;
