import React, { useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  QrCode,
  Search,
  Receipt,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RefundItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  refundQuantity: number;
  refundReason: string;
}

interface ReceiptData {
  id: string;
  receiptNumber: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: RefundItem[];
  total: number;
  paymentMethod: string;
  status: string;
}

const RefundScanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"receipt" | "barcode" | "manual">(
    "receipt"
  );
  const [receiptNumber, setReceiptNumber] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [foundReceipt, setFoundReceipt] = useState<ReceiptData | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock receipt data for demonstration
  const mockReceipts: ReceiptData[] = [
    {
      id: "1",
      receiptNumber: "RCP-2024-001",
      date: "2024-01-15",
      customer: {
        name: "Ahmed Hassan",
        phone: "+201234567890",
        email: "ahmed@example.com",
      },
      items: [
        {
          id: "1",
          name: "The Great Gatsby",
          price: 150,
          quantity: 1,
          refundQuantity: 0,
          refundReason: "",
        },
        {
          id: "2",
          name: "1984 by George Orwell",
          price: 120,
          quantity: 2,
          refundQuantity: 0,
          refundReason: "",
        },
      ],
      total: 390,
      paymentMethod: "Cash",
      status: "completed",
    },
  ];

  const handleReceiptSearch = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const receipt = mockReceipts.find(
        (r) => r.receiptNumber === receiptNumber
      );
      if (receipt) {
        setFoundReceipt(receipt);
        setRefundItems(
          receipt.items.map((item) => ({
            ...item,
            refundQuantity: 0,
            refundReason: "",
          }))
        );
        toast({
          title: "Receipt Found",
          description: `Found receipt ${receipt.receiptNumber}`,
        });
      } else {
        toast({
          title: "Receipt Not Found",
          description: "No receipt found with this number",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 1000);
  };

  const handleBarcodeSearch = async () => {
    setLoading(true);
    // Simulate barcode search
    setTimeout(() => {
      const receipt = mockReceipts[0]; // Mock finding receipt by barcode
      setFoundReceipt(receipt);
      setRefundItems(
        receipt.items.map((item) => ({
          ...item,
          refundQuantity: 0,
          refundReason: "",
        }))
      );
      toast({
        title: "Product Found",
        description: "Found product in recent receipt",
      });
      setLoading(false);
    }, 1000);
  };

  const updateRefundQuantity = (itemId: string, quantity: number) => {
    setRefundItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, refundQuantity: Math.min(quantity, item.quantity) }
          : item
      )
    );
  };

  const updateRefundReason = (itemId: string, reason: string) => {
    setRefundItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, refundReason: reason } : item
      )
    );
  };

  const processRefund = () => {
    const itemsToRefund = refundItems.filter((item) => item.refundQuantity > 0);
    if (itemsToRefund.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to refund",
        variant: "destructive",
      });
      return;
    }

    const totalRefund = itemsToRefund.reduce(
      (sum, item) => sum + item.price * item.refundQuantity,
      0
    );

    toast({
      title: "Refund Processed",
      description: `Refund of EGP ${totalRefund} processed successfully`,
    });

    // Reset form
    setFoundReceipt(null);
    setRefundItems([]);
    setReceiptNumber("");
    setBarcodeInput("");
  };

  const refundReasons = [
    "Defective product",
    "Wrong item received",
    "Customer changed mind",
    "Duplicate purchase",
    "Product not as described",
    "Other",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Refund Scanner
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Refund Scanner
          </DialogTitle>
          <DialogDescription>
            Scan receipt barcode or enter receipt number to process refunds
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Mode Selection */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === "receipt" ? "default" : "outline"}
              onClick={() => setScanMode("receipt")}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Receipt Number
            </Button>
            <Button
              variant={scanMode === "barcode" ? "default" : "outline"}
              onClick={() => setScanMode("barcode")}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Scan Barcode
            </Button>
            <Button
              variant={scanMode === "manual" ? "default" : "outline"}
              onClick={() => setScanMode("manual")}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Manual Search
            </Button>
          </div>

          {/* Search Interface */}
          {!foundReceipt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {scanMode === "receipt" && "Enter Receipt Number"}
                  {scanMode === "barcode" && "Scan Product Barcode"}
                  {scanMode === "manual" && "Search by Customer"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scanMode === "receipt" && (
                  <div className="space-y-2">
                    <Label>Receipt Number</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter receipt number (e.g., RCP-2024-001)"
                        value={receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleReceiptSearch()
                        }
                      />
                      <Button
                        onClick={handleReceiptSearch}
                        disabled={!receiptNumber || loading}
                        className="flex items-center gap-2"
                      >
                        <Search className="h-4 w-4" />
                        {loading ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>
                )}

                {scanMode === "barcode" && (
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">
                        Point camera at barcode or QR code
                      </p>
                      <Button variant="outline" className="mb-4">
                        Open Camera
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Or enter barcode manually</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter barcode number"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleBarcodeSearch()
                          }
                        />
                        <Button
                          onClick={handleBarcodeSearch}
                          disabled={!barcodeInput || loading}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {scanMode === "manual" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Customer Name</Label>
                        <Input placeholder="Enter customer name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="Enter phone number" />
                      </div>
                    </div>
                    <Button className="w-full">
                      <Search className="h-4 w-4 mr-2" />
                      Search Customer Receipts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Receipt Found */}
          {foundReceipt && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">
                    Receipt Found: {foundReceipt.receiptNumber}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFoundReceipt(null);
                    setRefundItems([]);
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Search
                </Button>
              </div>

              {/* Receipt Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receipt Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {foundReceipt.date}
                    </div>
                    <div>
                      <span className="font-medium">Customer:</span>{" "}
                      {foundReceipt.customer.name}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {foundReceipt.customer.phone}
                    </div>
                    <div>
                      <span className="font-medium">Payment:</span>{" "}
                      {foundReceipt.paymentMethod}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Items in Receipt:</h4>
                    {refundItems.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium">{item.name}</h5>
                            <p className="text-sm text-gray-600">
                              EGP {item.price} × {item.quantity}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Total: EGP {item.price * item.quantity}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Refund Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRefundQuantity(
                                    item.id,
                                    item.refundQuantity - 1
                                  )
                                }
                                disabled={item.refundQuantity <= 0}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={item.refundQuantity}
                                onChange={(e) =>
                                  updateRefundQuantity(
                                    item.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateRefundQuantity(
                                    item.id,
                                    item.refundQuantity + 1
                                  )
                                }
                                disabled={item.refundQuantity >= item.quantity}
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Refund Reason</Label>
                            <Select
                              value={item.refundReason}
                              onValueChange={(value) =>
                                updateRefundReason(item.id, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {refundReasons.map((reason) => (
                                  <SelectItem key={reason} value={reason}>
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {item.refundQuantity > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">
                                Refund Amount:
                              </span>
                              <span className="font-semibold text-blue-600">
                                EGP {item.price * item.refundQuantity}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold">
                      Total Refund: EGP{" "}
                      {refundItems.reduce(
                        (sum, item) => sum + item.price * item.refundQuantity,
                        0
                      )}
                    </div>
                    <Button
                      onClick={processRefund}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Process Refund
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundScanner;
