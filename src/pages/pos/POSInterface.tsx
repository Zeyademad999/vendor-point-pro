import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Search, Minus, Plus, CreditCard, DollarSign, Receipt, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const POSInterface = () => {
  const [cart, setCart] = useState<Array<{id: string, name: string, price: number, quantity: number}>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const { toast } = useToast();

  const products = [
    { id: '1', name: 'Hair Cut', price: 25.00, category: 'Services', stock: null },
    { id: '2', name: 'Shampoo Premium', price: 12.99, category: 'Products', stock: 45 },
    { id: '3', name: 'Beard Trim', price: 15.00, category: 'Services', stock: null },
    { id: '4', name: 'Hair Styling Gel', price: 8.50, category: 'Products', stock: 32 },
    { id: '5', name: 'Facial Treatment', price: 35.00, category: 'Services', stock: null },
    { id: '6', name: 'Conditioner', price: 14.99, category: 'Products', stock: 28 },
  ];

  const customers = [
    { id: '1', name: 'John Smith', phone: '+1-555-0123' },
    { id: '2', name: 'Sarah Johnson', phone: '+1-555-0124' },
    { id: '3', name: 'Mike Wilson', phone: '+1-555-0125' },
  ];

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processPayment = () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add items to cart before processing payment', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Payment Processed', description: `Transaction completed successfully: $${getTotalAmount().toFixed(2)}` });
    setCart([]);
    setSelectedCustomer('');
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Point of Sale</h1>
          <p className="text-muted-foreground">Process sales and manage transactions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Products & Services</span>
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-9 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold mb-1">{product.name}</h3>
                          <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                          <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
                          {product.stock !== null && (
                            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart & Checkout Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Current Sale</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm min-w-[20px] text-center">{item.quantity}</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Cash</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Card</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Process Payment Button */}
                <Button 
                  onClick={processPayment} 
                  className="w-full h-12 text-lg"
                  disabled={cart.length === 0}
                >
                  <Receipt className="mr-2 h-5 w-5" />
                  Process Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSInterface;