import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Scissors,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Camera,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { serviceService, Service as ServiceType } from "@/services/services";
import { useAuth } from "@/contexts/AuthContext";

const Services = () => {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    category_id: "",
    category_name: "",
    price: "",
    duration: "",
    booking_enabled: true,
    available_times: "",
    notes: "",
  });
  const [editingService, setEditingService] = useState<ServiceType | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(
    null
  );
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Fetch services and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [servicesResponse, categoriesResponse] = await Promise.all([
          serviceService.getServices(),
          serviceService.getCategories(),
        ]);

        if (servicesResponse.success) {
          setServices(servicesResponse.data);
        }

        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredServices = services.filter(
    (service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.category_name &&
        service.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (active: boolean) => {
    return active
      ? "bg-success text-success-foreground"
      : "bg-muted text-muted-foreground";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Hair Services":
        return "bg-primary text-primary-foreground";
      case "Beard Services":
        return "bg-secondary text-secondary-foreground";
      case "Skincare":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === "new") {
      // User wants to create a new category
      setNewService({ ...newService, category_id: "", category_name: "" });
    } else {
      // User selected an existing category
      const selectedCategory = categories.find(
        (cat) => cat.id.toString() === value
      );
      setNewService({
        ...newService,
        category_id: value,
        category_name: selectedCategory?.name || "",
      });
    }
  };

  const handleAddService = async () => {
    try {
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to add services",
          variant: "destructive",
        });
        return;
      }

      if (!newService.name.trim()) {
        toast({
          title: "Error",
          description: "Service name is required",
          variant: "destructive",
        });
        return;
      }

      if (!newService.price || isNaN(parseFloat(newService.price))) {
        toast({
          title: "Error",
          description: "Valid price is required",
          variant: "destructive",
        });
        return;
      }

      // Handle category creation if needed
      let categoryId = null;
      if (newService.category_name && newService.category_name.trim()) {
        // Check if category exists
        const existingCategory = categories.find(
          (cat) =>
            cat.name.toLowerCase() ===
            newService.category_name.trim().toLowerCase()
        );

        if (!existingCategory) {
          // Create new category
          try {
            const categoryResponse = await serviceService.createCategory({
              name: newService.category_name.trim(),
              client_id: user?.id || 1, // Use user ID from auth context
            });
            if (categoryResponse.success) {
              categoryId = categoryResponse.data.id;
              // Add to local categories list
              setCategories([...categories, categoryResponse.data]);
            }
          } catch (error) {
            console.error("Error creating category:", error);
            toast({
              title: "Error",
              description: "Failed to create category",
              variant: "destructive",
            });
            return;
          }
        } else {
          categoryId = existingCategory.id;
        }
      } else if (newService.category_id && newService.category_id.trim()) {
        categoryId = parseInt(newService.category_id);
      }

      const serviceData = {
        name: newService.name.trim(),
        description: newService.description.trim() || null,
        category_id: categoryId,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration) || 30,
        booking_enabled: newService.booking_enabled,
        available_times:
          newService.available_times && newService.available_times.trim()
            ? (() => {
                try {
                  return JSON.parse(newService.available_times);
                } catch (e) {
                  console.warn(
                    "Invalid JSON in available_times, setting to null"
                  );
                  return null;
                }
              })()
            : null,
        notes: newService.notes.trim() || null,
        active: true,
      };

      console.log("Sending service data:", serviceData);

      const response = await serviceService.createService(serviceData);

      if (response.success) {
        setServices([...services, response.data]);
        setNewService({
          name: "",
          description: "",
          category_id: "",
          category_name: "",
          price: "",
          duration: "",
          booking_enabled: true,
          available_times: "",
          notes: "",
        });
        setIsDialogOpen(false);
        toast({
          title: "Service Added",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding service:", error);

      // Try to extract validation errors from the response
      let errorMessage = "Failed to add service";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // If it's an axios error with validation details
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.errors) {
          const validationErrors = axiosError.response.data.errors;
          errorMessage = validationErrors.map((err: any) => err.msg).join(", ");
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditService = async () => {
    if (!editingService || !editingService.id) return;

    try {
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to edit services",
          variant: "destructive",
        });
        return;
      }

      const updateData: Partial<ServiceType> = {};

      if (editingService.name) updateData.name = editingService.name;
      if (editingService.description !== undefined)
        updateData.description = editingService.description;
      if (editingService.category_id)
        updateData.category_id = editingService.category_id;
      if (editingService.price) updateData.price = editingService.price;
      if (editingService.duration)
        updateData.duration = editingService.duration;
      if (editingService.booking_enabled !== undefined)
        updateData.booking_enabled = editingService.booking_enabled;
      if (editingService.available_times !== undefined)
        updateData.available_times = editingService.available_times;
      if (editingService.notes !== undefined)
        updateData.notes = editingService.notes;
      if (editingService.active !== undefined)
        updateData.active = editingService.active;

      const response = await serviceService.updateService(
        editingService.id,
        updateData
      );

      if (response.success) {
        setServices(
          services.map((s) => (s.id === editingService.id ? response.data : s))
        );
        setEditingService(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Service Updated",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async () => {
    if (!deletingServiceId) return;

    try {
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to delete services",
          variant: "destructive",
        });
        return;
      }

      const response = await serviceService.deleteService(deletingServiceId);

      if (response.success) {
        setServices(services.filter((s) => s.id !== deletingServiceId));
        setDeletingServiceId(null);
        toast({
          title: "Service Deleted",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (service: ServiceType) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (serviceId: number) => {
    setDeletingServiceId(serviceId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading services...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">
            Manage your service offerings and pricing
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Create a new service offering
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input
                  placeholder="Service name"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Service description"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="space-y-2">
                  <Select
                    value={newService.category_id || "new"}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select or create a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Create New Category</SelectItem>
                      <SelectSeparator />
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(newService.category_id === "new" ||
                    !newService.category_id) && (
                    <Input
                      placeholder="Enter new category name"
                      value={newService.category_name}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          category_name: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService({ ...newService, price: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService({ ...newService, duration: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes"
                  value={newService.notes}
                  onChange={(e) =>
                    setNewService({ ...newService, notes: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="booking-enabled"
                  checked={newService.booking_enabled}
                  onCheckedChange={(checked) =>
                    setNewService({ ...newService, booking_enabled: checked })
                  }
                />
                <Label htmlFor="booking-enabled">Enable Booking</Label>
              </div>
              <Button onClick={handleAddService} className="w-full">
                Add Service
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
            <p className="text-xs text-success">All services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Booking Enabled
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.booking_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Can be booked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {services.length > 0
                ? (
                    services.reduce((sum, s) => sum + (s.price || 0), 0) /
                    services.length
                  ).toFixed(0)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Per service</p>
          </CardContent>
        </Card>
      </div>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services Database</CardTitle>
              <CardDescription>
                Manage service information and pricing
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
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
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.description || "No description"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getCategoryColor(service.category_name || "")}
                    >
                      {service.category_name || "Uncategorized"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    EGP {(service.price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.duration || 30} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        service.booking_enabled
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {service.booking_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(service.active || false)}>
                      {service.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(service)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(service.id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {service.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteService}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service information</DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  placeholder="Service name"
                  value={editingService.name || ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Service description"
                  value={editingService.description || ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editingService.price || ""}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={editingService.duration || ""}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        duration: parseInt(e.target.value) || 30,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes"
                  value={editingService.notes || ""}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-booking-enabled"
                  checked={editingService.booking_enabled || false}
                  onCheckedChange={(checked) =>
                    setEditingService({
                      ...editingService,
                      booking_enabled: checked,
                    })
                  }
                />
                <Label htmlFor="edit-booking-enabled">Enable Booking</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editingService.active || false}
                  onCheckedChange={(checked) =>
                    setEditingService({ ...editingService, active: checked })
                  }
                />
                <Label htmlFor="edit-active">Active Service</Label>
              </div>
              <Button onClick={handleEditService} className="w-full">
                Update Service
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
