import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  walletService,
  Wallet as WalletType,
  WalletTransaction,
  WalletStats,
} from "@/services/wallets";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  Eye,
  Edit,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  Filter,
  Clock,
  CheckCircle,
  X,
  Loader2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";

const Wallet: React.FC = () => {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats>({
    totalBalance: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    netBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wallets");
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showEditWallet, setShowEditWallet] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [transactionTab, setTransactionTab] = useState("transfer");
  const { toast } = useToast();

  // Form states
  const [walletForm, setWalletForm] = useState({
    name: "",
    initial_balance: 0,
    wallet_type: "custom",
    currency: "EGP",
    color: "#10B981",
    description: "",
  });

  const [editWalletForm, setEditWalletForm] = useState({
    name: "",
    wallet_type: "custom",
    currency: "EGP",
    color: "#10B981",
    description: "",
  });

  const [transactionForm, setTransactionForm] = useState({
    wallet_id: "",
    transaction_type: "credit" as "credit" | "debit",
    amount: 0,
    category: "general",
    description: "",
  });

  const [transferForm, setTransferForm] = useState({
    from_wallet_id: "",
    to_wallet_id: "",
    amount: 0,
    description: "",
  });

  // Loading states
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [updatingWallet, setUpdatingWallet] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [deletingWallet, setDeletingWallet] = useState<number | null>(null);

  // Constants
  const walletColors = [
    "#10B981",
    "#3B82F6",
    "#8B5CF6",
    "#EF4444",
    "#F97316",
    "#EC4899",
    "#06B6D4",
    "#6B7280",
  ];

  const walletTypes = [
    { value: "custom", label: "Custom Wallet" },
    { value: "business", label: "Business Account" },
    { value: "personal", label: "Personal Wallet" },
    { value: "savings", label: "Savings Account" },
  ];

  const transactionCategories = [
    { value: "general", label: "General" },
    { value: "revenue", label: "Revenue" },
    { value: "cost", label: "Cost" },
    { value: "transfer", label: "Transfer" },
    { value: "salary", label: "Salary" },
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "marketing", label: "Marketing" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadWallets(), loadStats(), loadTransactions()]);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      const response = await walletService.getWallets();
      if (response.success) {
        setWallets(response.data);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await walletService.getWalletStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading wallet stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await walletService.getWalletTransactions({ limit: 50 });
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const handleCreateWallet = async () => {
    if (!walletForm.name.trim()) {
      toast({
        title: "Error",
        description: "Wallet name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingWallet(true);
      const response = await walletService.createWallet(walletForm);
      if (response.success) {
        toast({
          title: "Success",
          description: "Wallet created successfully",
        });
        setShowAddWallet(false);
        setWalletForm({
          name: "",
          initial_balance: 0,
          wallet_type: "custom",
          currency: "EGP",
          color: "#10B981",
          description: "",
        });
        loadData();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create wallet";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreatingWallet(false);
    }
  };

  const handleUpdateWallet = async () => {
    if (!selectedWallet || !editWalletForm.name.trim()) {
      toast({
        title: "Error",
        description: "Wallet name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingWallet(true);
      const response = await walletService.updateWallet(
        selectedWallet.id,
        editWalletForm
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Wallet updated successfully",
        });
        setShowEditWallet(false);
        setSelectedWallet(null);
        loadData();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update wallet";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingWallet(false);
    }
  };

  const handleAddTransaction = async () => {
    if (
      !transactionForm.wallet_id ||
      !transactionForm.amount ||
      transactionForm.amount <= 0
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingTransaction(true);
      const response = await walletService.addTransaction({
        wallet_id: parseInt(transactionForm.wallet_id),
        transaction_type: transactionForm.transaction_type,
        amount: transactionForm.amount,
        category: transactionForm.category,
        description: transactionForm.description,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction added successfully",
        });
        setShowAddTransaction(false);
        setTransactionForm({
          wallet_id: "",
          transaction_type: "credit",
          amount: 0,
          category: "general",
          description: "",
        });
        loadData();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add transaction";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingTransaction(false);
    }
  };

  const handleTransfer = async () => {
    if (
      !transferForm.from_wallet_id ||
      !transferForm.to_wallet_id ||
      !transferForm.amount ||
      transferForm.amount <= 0
    ) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (transferForm.from_wallet_id === transferForm.to_wallet_id) {
      toast({
        title: "Error",
        description: "Cannot transfer to the same wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferring(true);
      const response = await walletService.transferBetweenWallets({
        from_wallet_id: parseInt(transferForm.from_wallet_id),
        to_wallet_id: parseInt(transferForm.to_wallet_id),
        amount: transferForm.amount,
        description: transferForm.description,
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Transfer completed successfully",
        });
        setShowTransfer(false);
        setTransferForm({
          from_wallet_id: "",
          to_wallet_id: "",
          amount: 0,
          description: "",
        });
        loadData();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete transfer";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTransferring(false);
    }
  };

  const handleDeleteWallet = async (walletId: number) => {
    try {
      setDeletingWallet(walletId);
      const response = await walletService.deleteWallet(walletId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Wallet deleted successfully",
        });
        setShowWalletDetails(false);
        setSelectedWallet(null);
        loadData();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete wallet";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeletingWallet(null);
    }
  };

  const openEditWallet = (wallet: WalletType) => {
    setSelectedWallet(wallet);
    setEditWalletForm({
      name: wallet.name,
      wallet_type: wallet.wallet_type,
      currency: wallet.currency,
      color: wallet.color,
      description: wallet.description || "",
    });
    setShowEditWallet(true);
  };

  const openWalletDetails = (wallet: WalletType) => {
    setSelectedWallet(wallet);
    setShowWalletDetails(true);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "debit":
        return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      case "transfer":
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "credit":
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">Credit</Badge>
        );
      case "debit":
        return <Badge className="bg-red-100 text-red-800 text-xs">Debit</Badge>;
      case "transfer":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs">Transfer</Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Wallets</h1>
          <p className="text-gray-600">
            Manage your brand's financial accounts and transactions
          </p>
        </div>
        <Button
          onClick={() => setShowAddWallet(true)}
          className="bg-black hover:bg-gray-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Wallet
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Balance
              </p>
              <p className="text-2xl font-bold text-green-600">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(stats.totalBalance)
                )}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(stats.totalExpenses)
                )}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Net Balance
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  formatCurrency(stats.netBalance)
                )}
              </p>
            </div>
            <WalletIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <WalletIcon className="w-4 h-4" />
            Your Wallets
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Wallet Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-4">
          {/* Wallets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <Card
                key={wallet.id}
                className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                style={{ backgroundColor: wallet.color }}
                onClick={() => openWalletDetails(wallet)}
              >
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium uppercase">
                      WALLET
                    </span>
                    <span className="text-sm font-medium uppercase">
                      {wallet.wallet_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm uppercase mb-1">BALANCE</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(wallet.balance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase mb-1">WALLET NAME</p>
                    <p className="text-lg font-medium">{wallet.name}</p>
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Transaction Management */}
            <div className="lg:col-span-1">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="h-5 w-5" />
                  <h3 className="font-medium">Wallet Transactions</h3>
                </div>

                <Tabs
                  value={transactionTab}
                  onValueChange={setTransactionTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="transfer"
                      className="flex items-center gap-1 text-xs"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      Transfer
                    </TabsTrigger>
                    <TabsTrigger
                      value="transaction"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Add Transaction
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="transfer" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-sm">From Wallet</Label>
                      <Select
                        value={transferForm.from_wallet_id}
                        onValueChange={(value) =>
                          setTransferForm((prev) => ({
                            ...prev,
                            from_wallet_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select source wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem
                              key={wallet.id}
                              value={wallet.id.toString()}
                            >
                              {wallet.name} - {formatCurrency(wallet.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">To Wallet</Label>
                      <Select
                        value={transferForm.to_wallet_id}
                        onValueChange={(value) =>
                          setTransferForm((prev) => ({
                            ...prev,
                            to_wallet_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select destination..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem
                              key={wallet.id}
                              value={wallet.id.toString()}
                            >
                              {wallet.name} - {formatCurrency(wallet.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={transferForm.amount}
                        onChange={(e) =>
                          setTransferForm((prev) => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Description (Optional)</Label>
                      <Textarea
                        placeholder="Enter description"
                        value={transferForm.description}
                        onChange={(e) =>
                          setTransferForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleTransfer}
                      disabled={transferring}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      {transferring ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Transfer Funds"
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="transaction" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-sm">Wallet</Label>
                      <Select
                        value={transactionForm.wallet_id}
                        onValueChange={(value) =>
                          setTransactionForm((prev) => ({
                            ...prev,
                            wallet_id: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem
                              key={wallet.id}
                              value={wallet.id.toString()}
                            >
                              {wallet.name} - {formatCurrency(wallet.balance)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Transaction Type</Label>
                      <Select
                        value={transactionForm.transaction_type}
                        onValueChange={(value) =>
                          setTransactionForm((prev) => ({
                            ...prev,
                            transaction_type: value as "credit" | "debit",
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">
                            Credit (Add Money)
                          </SelectItem>
                          <SelectItem value="debit">
                            Debit (Remove Money)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={transactionForm.amount}
                        onChange={(e) =>
                          setTransactionForm((prev) => ({
                            ...prev,
                            amount: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Category</Label>
                      <Select
                        value={transactionForm.category}
                        onValueChange={(value) =>
                          setTransactionForm((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionCategories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Description (Optional)</Label>
                      <Textarea
                        placeholder="Enter description"
                        value={transactionForm.description}
                        onChange={(e) =>
                          setTransactionForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleAddTransaction}
                      disabled={addingTransaction}
                      className="w-full bg-black hover:bg-gray-800 text-white"
                    >
                      {addingTransaction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Add Transaction"
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right Panel - Transaction History */}
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <h3 className="font-medium">Transaction History</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {transactions.length} total transactions
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium text-sm">
                            {transaction.transaction_type === "credit"
                              ? "Credit"
                              : "Debit"}{" "}
                            Transaction
                          </p>
                          <p className="text-xs text-gray-600">
                            {transaction.wallet_name} •{" "}
                            {transaction.description || "No description"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-medium text-sm ${
                            transaction.transaction_type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "credit"
                            ? "+"
                            : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>

                      <div>
                        {getTransactionBadge(transaction.transaction_type)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Wallet Modal */}
      <Dialog open={showAddWallet} onOpenChange={setShowAddWallet}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label>Wallet Name</Label>
                <Input
                  placeholder="e.g., Business Account, Personal Wallet"
                  value={walletForm.name}
                  onChange={(e) =>
                    setWalletForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label>Initial Balance</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={walletForm.initial_balance}
                  onChange={(e) =>
                    setWalletForm((prev) => ({
                      ...prev,
                      initial_balance: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Wallet Type</Label>
                <Select
                  value={walletForm.wallet_type}
                  onValueChange={(value) =>
                    setWalletForm((prev) => ({ ...prev, wallet_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {walletTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={walletForm.currency}
                  onValueChange={(value) =>
                    setWalletForm((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: walletForm.color }}
                  />
                  Wallet Color
                </Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {walletColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        walletForm.color === color
                          ? "border-black"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setWalletForm((prev) => ({ ...prev, color }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddWallet(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWallet}
                  disabled={creatingWallet}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  {creatingWallet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Wallet"
                  )}
                </Button>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <h3 className="font-medium mb-4">Live Preview</h3>
              <Card
                className="relative overflow-hidden"
                style={{ backgroundColor: walletForm.color }}
              >
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium uppercase">
                      WALLET
                    </span>
                    <span className="text-sm font-medium uppercase">
                      {walletForm.wallet_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm uppercase mb-1">BALANCE</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(walletForm.initial_balance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase mb-1">WALLET NAME</p>
                    <p className="text-lg font-medium">
                      {walletForm.name || "Your Wallet"}
                    </p>
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Modal */}
      <Dialog open={showEditWallet} onOpenChange={setShowEditWallet}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label>Wallet Name</Label>
                <Input
                  placeholder="e.g., Business Account, Personal Wallet"
                  value={editWalletForm.name}
                  onChange={(e) =>
                    setEditWalletForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Wallet Type</Label>
                <Select
                  value={editWalletForm.wallet_type}
                  onValueChange={(value) =>
                    setEditWalletForm((prev) => ({
                      ...prev,
                      wallet_type: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {walletTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select
                  value={editWalletForm.currency}
                  onValueChange={(value) =>
                    setEditWalletForm((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: editWalletForm.color }}
                  />
                  Wallet Color
                </Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {walletColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        editWalletForm.color === color
                          ? "border-black"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setEditWalletForm((prev) => ({ ...prev, color }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Wallet description"
                  value={editWalletForm.description}
                  onChange={(e) =>
                    setEditWalletForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditWallet(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateWallet}
                  disabled={updatingWallet}
                  className="flex-1 bg-black hover:bg-gray-800 text-white"
                >
                  {updatingWallet ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update Wallet"
                  )}
                </Button>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <h3 className="font-medium mb-4">Live Preview</h3>
              <Card
                className="relative overflow-hidden"
                style={{ backgroundColor: editWalletForm.color }}
              >
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium uppercase">
                      WALLET
                    </span>
                    <span className="text-sm font-medium uppercase">
                      {editWalletForm.wallet_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm uppercase mb-1">BALANCE</p>
                    <p className="text-3xl font-bold">
                      {selectedWallet
                        ? formatCurrency(selectedWallet.balance)
                        : "0 EGP"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase mb-1">WALLET NAME</p>
                    <p className="text-lg font-medium">
                      {editWalletForm.name || "Your Wallet"}
                    </p>
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                    <div className="w-3 h-3 bg-white bg-opacity-30 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Details Modal */}
      <Dialog open={showWalletDetails} onOpenChange={setShowWalletDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wallet Details</DialogTitle>
          </DialogHeader>

          {selectedWallet && (
            <div className="space-y-6">
              {/* Wallet Card Preview */}
              <Card
                className="relative overflow-hidden"
                style={{ backgroundColor: selectedWallet.color }}
              >
                <CardContent className="p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium uppercase">
                      WALLET
                    </span>
                    <span className="text-sm font-medium uppercase">
                      {selectedWallet.wallet_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm uppercase mb-1">BALANCE</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(selectedWallet.balance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm uppercase mb-1">WALLET NAME</p>
                    <p className="text-lg font-medium">{selectedWallet.name}</p>
                  </div>

                  <div className="absolute top-4 right-4">
                    <button className="text-white hover:text-gray-200">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Wallet Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Current Balance:</span>
                  <span className="text-green-600 font-bold">
                    {formatCurrency(selectedWallet.balance)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(selectedWallet.created_at)}</span>
                </div>

                {selectedWallet.description && (
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 text-gray-500 mt-0.5">📝</div>
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedWallet.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEditWallet(selectedWallet)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Wallet
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteWallet(selectedWallet.id)}
                  disabled={deletingWallet === selectedWallet.id}
                >
                  {deletingWallet === selectedWallet.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Wallet
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
