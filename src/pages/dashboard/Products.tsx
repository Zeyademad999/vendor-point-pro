import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/Layout/AppLayout';

const Products = () => {
  const [products, setProducts] = useState([
    { 
      id: 1, 
      name: 'Premium Shampoo', 
      category: 'Hair Care', 
      price: 24.99, 
      stock: 45, 
      lowStockAlert: 10, 
      supplier: 'Beauty Supply Co', 
      avgBuyPrice: 12.50,
      sales: 156,
      status: 'Active'
    },
    { 
      id: 2, 
      name: 'Hair Styling Gel', 
      category: 'Styling', 
      price: 16.99, 
      stock: 32, 
      lowStockAlert: 15, 
      supplier: 'Style Products Ltd', 
      avgBuyPrice: 8.00,
      sales: 89,
      status: 'Active'
    },
    { 
      id: 3, 
      name: 'Beard Oil', 
      category: 'Beard Care', 
      price: 19.99, 
      stock: 8, 
      lowStockAlert: 10, 
      supplier: 'Grooming Essentials', 
      avgBuyPrice: 9.50,
      sales: 234,
      status: 'Low Stock'
    },
    { 
      id: 4, 
      name: 'Hair Conditioner', 
      category: 'Hair Care', 
      price: 22.99, 
      stock: 28, 
      lowStockAlert: 12, 
      supplier: 'Beauty Supply Co', 
      avgBuyPrice: 11.25,
      sales: 78,
      status: 'Active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', category: '', price: '', stock: '', lowStockAlert: '', supplier: '', avgBuyPrice: ''
  });
  const { toast } = useToast();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock <= lowStockAlert) return { status: 'Low Stock', color: 'bg-warning text-warning-foreground' };
    if (stock === 0) return { status: 'Out of Stock', color: 'bg-destructive text-destructive-foreground' };
    return { status: 'In Stock', color: 'bg-success text-success-foreground' };
  };

  const handleAddProduct = () => {
    const id = products.length + 1;
    const product = {
      ...newProduct,
      id,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      lowStockAlert: parseInt(newProduct.lowStockAlert),
      avgBuyPrice: parseFloat(newProduct.avgBuyPrice),
      sales: 0,
      status: 'Active'
    };
    setProducts([...products, product]);
    setNewProduct({ name: '', category: '', price: '', stock: '', lowStockAlert: '', supplier: '', avgBuyPrice: '' });
    toast({ title: 'Product Added', description: 'New product has been added successfully' });
  };

  const lowStockProducts = products.filter(p => p.stock <= p.lowStockAlert).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Products & Inventory</h1>
            <p className="text-muted-foreground">Manage your product catalog and stock levels</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Create a new product in your inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input 
                      placeholder="Product name" 
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input 
                      placeholder="Category" 
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Low Stock Alert</Label>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      value={newProduct.lowStockAlert}
                      onChange={(e) => setNewProduct({...newProduct, lowStockAlert: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input 
                      placeholder="Supplier name" 
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct({...newProduct, supplier: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Buy Price ($)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={newProduct.avgBuyPrice}
                      onChange={(e) => setNewProduct({...newProduct, avgBuyPrice: e.target.value})}
                    />
                  </div>
                </div>
                <Button onClick={handleAddProduct} className="w-full">Add Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{lowStockProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(products.map(p => p.category)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Manage your product catalog and stock levels</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.lowStockAlert);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Buy: ${product.avgBuyPrice}</p>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="font-medium">${product.price}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.stock}</p>
                          <p className="text-xs text-muted-foreground">Alert: {product.lowStockAlert}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>{product.supplier}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Products;