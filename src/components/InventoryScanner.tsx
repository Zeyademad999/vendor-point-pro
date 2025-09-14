import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Camera,
  Barcode,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Scan,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  X,
  BarChart3,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  barcode: string;
  currentStock: number;
  countedStock: number;
  difference: number;
  status: "matched" | "over" | "under" | "not_counted";
}

interface InventoryScan {
  id: string;
  date: string;
  products: Product[];
  totalProducts: number;
  matchedProducts: number;
  discrepancies: number;
  status: "in_progress" | "completed";
}

const InventoryScanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("scanner");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [currentScan, setCurrentScan] = useState<InventoryScan | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const { toast } = useToast();

  // Mock products data - in real app, this would come from your product service
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "The Great Gatsby",
      barcode: "1234567890123",
      currentStock: 10,
      countedStock: 0,
      difference: 0,
      status: "not_counted",
    },
    {
      id: "2",
      name: "1984 by George Orwell",
      barcode: "1234567890124",
      currentStock: 15,
      countedStock: 0,
      difference: 0,
      status: "not_counted",
    },
    {
      id: "3",
      name: "To Kill a Mockingbird",
      barcode: "1234567890125",
      currentStock: 8,
      countedStock: 0,
      difference: 0,
      status: "not_counted",
    },
    {
      id: "4",
      name: "Pride and Prejudice",
      barcode: "1234567890126",
      currentStock: 12,
      countedStock: 0,
      difference: 0,
      status: "not_counted",
    },
    {
      id: "5",
      name: "The Catcher in the Rye",
      barcode: "1234567890127",
      currentStock: 6,
      countedStock: 0,
      difference: 0,
      status: "not_counted",
    },
  ];

  // Initialize scan when modal opens
  useEffect(() => {
    if (isOpen) {
      startNewScan();
    }
  }, [isOpen]);

  const startNewScan = () => {
    const newScan: InventoryScan = {
      id: `scan_${Date.now()}`,
      date: new Date().toISOString(),
      products: mockProducts.map(product => ({
        ...product,
        countedStock: 0,
        difference: 0,
        status: "not_counted" as const,
      })),
      totalProducts: mockProducts.length,
      matchedProducts: 0,
      discrepancies: 0,
      status: "in_progress",
    };
    setCurrentScan(newScan);
    setProducts(newScan.products);
  };

  const handleBarcodeScan = (barcode: string) => {
    if (!barcode.trim()) return;

    const productIndex = products.findIndex(p => p.barcode === barcode.trim());
    
    if (productIndex !== -1) {
      const updatedProducts = [...products];
      updatedProducts[productIndex].countedStock += 1;
      updatedProducts[productIndex].difference = 
        updatedProducts[productIndex].countedStock - updatedProducts[productIndex].currentStock;
      
      // Update status based on difference
      if (updatedProducts[productIndex].difference === 0) {
        updatedProducts[productIndex].status = "matched";
      } else if (updatedProducts[productIndex].difference > 0) {
        updatedProducts[productIndex].status = "over";
      } else {
        updatedProducts[productIndex].status = "under";
      }

      setProducts(updatedProducts);
      
      toast({
        title: "Product Scanned",
        description: `Counted ${updatedProducts[productIndex].name}: ${updatedProducts[productIndex].countedStock}`,
      });
    } else {
      toast({
        title: "Product Not Found",
        description: `No product found with barcode: ${barcode}`,
        variant: "destructive",
      });
    }
  };

  const simulateCameraScan = () => {
    setIsScanning(true);
    setShowCamera(true);
    
    // Simulate camera scanning
    setTimeout(() => {
      const randomBarcode = mockProducts[Math.floor(Math.random() * mockProducts.length)].barcode;
      setScannedBarcode(randomBarcode);
      handleBarcodeScan(randomBarcode);
      setIsScanning(false);
      setShowCamera(false);
    }, 2000);
  };

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      handleBarcodeScan(manualBarcode);
      setManualBarcode("");
    }
  };

  const updateCount = (productId: string, newCount: number) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        const difference = newCount - product.currentStock;
        let status: Product["status"] = "not_counted";
        
        if (newCount > 0) {
          if (difference === 0) {
            status = "matched";
          } else if (difference > 0) {
            status = "over";
          } else {
            status = "under";
          }
        }

        return {
          ...product,
          countedStock: newCount,
          difference,
          status,
        };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const getStatusIcon = (status: Product["status"]) => {
    switch (status) {
      case "matched": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "over": return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "under": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "matched": return "bg-green-100 text-green-800";
      case "over": return "bg-blue-100 text-blue-800";
      case "under": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: Product["status"]) => {
    switch (status) {
      case "matched": return "Matched";
      case "over": return "Over";
      case "under": return "Under";
      default: return "Not Counted";
    }
  };

  const completedProducts = products.filter(p => p.status !== "not_counted").length;
  const matchedProducts = products.filter(p => p.status === "matched").length;
  const discrepancies = products.filter(p => p.status === "over" || p.status === "under").length;

  const completeInventory = () => {
    if (currentScan) {
      const completedScan: InventoryScan = {
        ...currentScan,
        products,
        matchedProducts,
        discrepancies,
        status: "completed",
      };
      setCurrentScan(completedScan);
      
      toast({
        title: "Inventory Scan Completed",
        description: `Scanned ${completedProducts} products with ${discrepancies} discrepancies`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Scan className="h-4 w-4" />
          Inventory Scan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inventory Scan
          </DialogTitle>
          <DialogDescription>
            Scan barcodes to count actual inventory and compare with system records
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products ({completedProducts}/{products.length})
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Camera Scanner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Barcode Scanner
                  </CardTitle>
                  <CardDescription>
                    Use camera to scan product barcodes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showCamera ? (
                    <div className="relative">
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Camera className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                          <p className="text-lg font-medium">Scanning...</p>
                          <p className="text-sm text-gray-300">Point camera at barcode</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-20 border-2 border-white rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <Camera className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Camera Ready</p>
                        <p className="text-sm">Click scan to start</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={simulateCameraScan}
                      disabled={isScanning}
                      className="flex-1"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan className="h-4 w-4 mr-2" />
                          Start Scan
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCamera(!showCamera)}
                    >
                      {showCamera ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Barcode className="h-5 w-5" />
                    Manual Entry
                  </CardTitle>
                  <CardDescription>
                    Enter barcode manually if scanner fails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Barcode</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter barcode manually"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleManualScan();
                          }
                        }}
                      />
                      <Button onClick={handleManualScan} disabled={!manualBarcode.trim()}>
                        <Barcode className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {scannedBarcode && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Last scanned: {scannedBarcode}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{completedProducts}</p>
                    <p className="text-sm text-gray-600">Scanned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{matchedProducts}</p>
                    <p className="text-sm text-gray-600">Matched</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{discrepancies}</p>
                    <p className="text-sm text-gray-600">Discrepancies</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{products.length - completedProducts}</p>
                    <p className="text-sm text-gray-600">Remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Inventory</h3>
              <Button onClick={completeInventory} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Complete Scan
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>System Stock</TableHead>
                    <TableHead>Counted</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                      <TableCell>{product.currentStock}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCount(product.id, Math.max(0, product.countedStock - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center">{product.countedStock}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCount(product.id, product.countedStock + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          product.difference > 0 ? "text-blue-600" : 
                          product.difference < 0 ? "text-red-600" : 
                          "text-green-600"
                        }`}>
                          {product.difference > 0 ? "+" : ""}{product.difference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(product.status)}
                            {getStatusText(product.status)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBarcodeScan(product.barcode)}
                        >
                          <Scan className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Scan Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Products:</span>
                      <span className="font-medium">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scanned Products:</span>
                      <span className="font-medium text-blue-600">{completedProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Matched:</span>
                      <span className="font-medium text-green-600">{matchedProducts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discrepancies:</span>
                      <span className="font-medium text-red-600">{discrepancies}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Completion Rate:</span>
                      <span>{Math.round((completedProducts / products.length) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Discrepancies</CardTitle>
                </CardHeader>
                <CardContent>
                  {discrepancies > 0 ? (
                    <div className="space-y-2">
                      {products
                        .filter(p => p.status === "over" || p.status === "under")
                        .map((product) => (
                          <div key={product.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-xs text-gray-600">
                                System: {product.currentStock} | Counted: {product.countedStock}
                              </p>
                            </div>
                            <Badge className={getStatusColor(product.status)}>
                              {product.difference > 0 ? "+" : ""}{product.difference}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No discrepancies found!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button onClick={completeInventory} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Complete Inventory Scan
              </Button>
              <Button variant="outline" onClick={startNewScan}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start New Scan
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryScanner;
