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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Loader2,
  Clock,
  UserPlus,
  CreditCard,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService, Staff as StaffType } from "@/services/staff";
import { useAuth } from "@/contexts/AuthContext";
import { StaffScheduleManager } from "@/components/StaffScheduleManager";
import { useSearchParams } from "react-router-dom";

const Staff = () => {
  const [staff, setStaff] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    salary: "",
    working_hours: "",
    notes: "",
    username: "",
    portal_access: "staff" as "staff" | "cashier" | "admin" | "all",
    can_login: false,
    password: "",
    permissions: {
      view_dashboard: true,
      manage_bookings: true,
      manage_customers: true,
      manage_products: true,
      manage_services: true,
      view_reports: true,
      pos_access: true,
      manage_staff: false,
      manage_settings: false,
    },
  });
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] =
    useState<StaffType | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedStaffForPermissions, setSelectedStaffForPermissions] =
    useState<StaffType | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  // Fetch staff on component mount
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await staffService.getStaff();

        if (response.success) {
          setStaff(response.data);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast({
          title: "Error",
          description: "Failed to fetch staff",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [toast]);

  // Handle URL action parameters
  useEffect(() => {
    const action = searchParams.get("action");
    if (action) {
      switch (action) {
        case "add-staff":
          setNewStaff((prev) => ({ ...prev, portal_access: "staff" }));
          setIsDialogOpen(true);
          break;
        case "add-cashier":
          setNewStaff((prev) => ({ ...prev, portal_access: "cashier" }));
          setIsDialogOpen(true);
          break;
        case "add-admin":
          setNewStaff((prev) => ({ ...prev, portal_access: "admin" }));
          setIsDialogOpen(true);
          break;
      }
    }
  }, [searchParams]);

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email &&
        member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddStaff = async () => {
    try {
      // Check authentication
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to add staff",
          variant: "destructive",
        });
        return;
      }

      // Basic validation
      if (!newStaff.name.trim()) {
        toast({
          title: "Error",
          description: "Staff name is required",
          variant: "destructive",
        });
        return;
      }

      const staffData = {
        name: newStaff.name.trim(),
        email: newStaff.email.trim(),
        phone: newStaff.phone.trim().replace(/[^0-9]/g, ""), // Remove non-numeric characters
        salary: parseFloat(newStaff.salary) || 0,
        working_hours: newStaff.working_hours.trim(),
        notes: newStaff.notes.trim(),
        active: true,
        hire_date: new Date().toISOString().split("T")[0],
        // Add login credentials if enabled
        ...(newStaff.can_login && {
          username: newStaff.username.trim(),
          password: newStaff.password,
          portal_access: newStaff.portal_access,
          can_login: true,
          permissions: newStaff.permissions,
        }),
      };

      const response = await staffService.createStaff(staffData);

      if (response.success) {
        setStaff([...staff, response.data]);
        setNewStaff({
          name: "",
          email: "",
          phone: "",
          salary: "",
          working_hours: "",
          notes: "",
          username: "",
          portal_access: "staff",
          can_login: false,
          password: "",
          permissions: {
            view_dashboard: true,
            manage_bookings: true,
            manage_customers: true,
            manage_products: true,
            manage_services: true,
            view_reports: true,
            pos_access: true,
            manage_staff: false,
            manage_settings: false,
          },
        });
        setIsDialogOpen(false);
        toast({
          title: "Staff Added",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add staff",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add staff",
        variant: "destructive",
      });
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff || !editingStaff.id) return;

    try {
      // Check authentication
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to edit staff",
          variant: "destructive",
        });
        return;
      }

      // Basic validation
      if (!editingStaff.name.trim()) {
        toast({
          title: "Error",
          description: "Staff name is required",
          variant: "destructive",
        });
        return;
      }

      const staffData = {
        name: editingStaff.name.trim(),
        email: editingStaff.email?.trim() || "",
        phone: editingStaff.phone?.trim().replace(/[^0-9]/g, "") || "",
        salary: editingStaff.salary || 0,
        working_hours: editingStaff.working_hours?.trim() || "",
        notes: editingStaff.notes?.trim() || "",
        active: editingStaff.active,
      };

      const response = await staffService.updateStaff(
        editingStaff.id,
        staffData
      );

      if (response.success) {
        setStaff(
          staff.map((s) => (s.id === editingStaff.id ? response.data : s))
        );
        setEditingStaff(null);
        setIsEditDialogOpen(false);
        toast({
          title: "Staff Updated",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update staff",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update staff",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaffId) return;

    try {
      // Check authentication
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to delete staff",
          variant: "destructive",
        });
        return;
      }

      const response = await staffService.deleteStaff(deletingStaffId);

      if (response.success) {
        setStaff(staff.filter((s) => s.id !== deletingStaffId));
        setDeletingStaffId(null);
        toast({
          title: "Staff Deleted",
          description: response.message,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete staff",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete staff",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (staffMember: StaffType) => {
    setEditingStaff(staffMember);
    setIsEditDialogOpen(true);
  };

  const openScheduleDialog = (staff: StaffType) => {
    setSelectedStaffForSchedule(staff);
    setIsScheduleDialogOpen(true);
  };

  const openPermissionsDialog = (staff: StaffType) => {
    setSelectedStaffForPermissions(staff);
    setIsPermissionsDialogOpen(true);
  };

  const openDeleteDialog = (staffId: number) => {
    setDeletingStaffId(staffId);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedStaffForPermissions || !selectedStaffForPermissions.id) return;

    try {
      const response = await staffService.updateStaff(
        selectedStaffForPermissions.id,
        {
          permissions: selectedStaffForPermissions.permissions,
        }
      );

      if (response.success) {
        // Update the staff list with new permissions
        setStaff(
          staff.map((s) =>
            s.id === selectedStaffForPermissions.id
              ? { ...s, permissions: selectedStaffForPermissions.permissions }
              : s
          )
        );

        setIsPermissionsDialogOpen(false);
        setSelectedStaffForPermissions(null);

        toast({
          title: "Permissions Updated",
          description: "Staff permissions have been updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading staff...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your staff members and their information
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setNewStaff((prev) => ({ ...prev, portal_access: "staff" }));
              setIsDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setNewStaff((prev) => ({ ...prev, portal_access: "cashier" }));
              setIsDialogOpen(true);
            }}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Add Cashier
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setNewStaff((prev) => ({ ...prev, portal_access: "admin" }));
              setIsDialogOpen(true);
            }}
          >
            <Shield className="h-4 w-4 mr-2" />
            Add Admin
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new staff member profile
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Staff name"
                    value={newStaff.name}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="staff@email.com"
                      value={newStaff.email}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="+1-555-0000"
                      value={newStaff.phone}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Salary ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newStaff.salary}
                      onChange={(e) =>
                        setNewStaff({ ...newStaff, salary: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <Input
                      placeholder="Mon-Fri 9AM-6PM"
                      value={newStaff.working_hours}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          working_hours: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Staff notes, skills, etc."
                    value={newStaff.notes}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, notes: e.target.value })
                    }
                  />
                </div>

                {/* Portal Access Configuration */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium text-sm">Portal Access</h3>

                  <div className="space-y-2">
                    <Label>Portal Access</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={newStaff.portal_access}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          portal_access: e.target.value as
                            | "staff"
                            | "cashier"
                            | "admin"
                            | "all",
                        })
                      }
                    >
                      <option value="staff">Staff Portal</option>
                      <option value="cashier">Cashier Portal</option>
                      <option value="admin">Admin Portal</option>
                      <option value="all">All Portals</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="can_login"
                      checked={newStaff.can_login}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          can_login: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                    />
                    <Label htmlFor="can_login" className="text-sm font-medium">
                      Enable Portal Login
                    </Label>
                  </div>

                  {newStaff.can_login && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          placeholder="staff_username"
                          value={newStaff.username}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              username: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          placeholder="Enter password"
                          value={newStaff.password}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              password: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Permission Controls */}
                {newStaff.can_login && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium text-sm">Section Permissions</h3>
                    <p className="text-sm text-gray-600">
                      Choose which sections this staff member can access
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="view_dashboard"
                          checked={newStaff.permissions?.view_dashboard}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                view_dashboard: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                        />
                        <Label htmlFor="view_dashboard" className="text-sm">
                          Dashboard
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_bookings"
                          checked={newStaff.permissions?.manage_bookings}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_bookings: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_bookings">Bookings</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_customers"
                          checked={newStaff.permissions?.manage_customers}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_customers: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_customers">Customers</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_products"
                          checked={newStaff.permissions?.manage_products}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_products: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_products">Products</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_services"
                          checked={newStaff.permissions?.manage_services}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_services: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_services">Services</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="view_reports"
                          checked={newStaff.permissions?.view_reports}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                view_reports: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="view_reports">Reports</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="pos_access"
                          checked={newStaff.permissions?.pos_access}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                pos_access: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="pos_access">POS</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_staff"
                          checked={newStaff.permissions?.manage_staff}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_staff: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_staff">Manage Staff</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manage_settings"
                          checked={newStaff.permissions?.manage_settings}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                ...newStaff.permissions!,
                                manage_settings: e.target.checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="manage_settings">Settings</Label>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Quick Presets:</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                view_dashboard: true,
                                manage_bookings: true,
                                manage_customers: true,
                                manage_products: true,
                                manage_services: true,
                                view_reports: true,
                                pos_access: true,
                                manage_staff: false,
                                manage_settings: false,
                              },
                            })
                          }
                        >
                          Standard Staff
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                view_dashboard: true,
                                manage_bookings: false,
                                manage_customers: false,
                                manage_products: false,
                                manage_services: false,
                                view_reports: false,
                                pos_access: true,
                                manage_staff: false,
                                manage_settings: false,
                              },
                            })
                          }
                        >
                          Cashier Only
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNewStaff({
                              ...newStaff,
                              permissions: {
                                view_dashboard: true,
                                manage_bookings: true,
                                manage_customers: true,
                                manage_products: true,
                                manage_services: true,
                                view_reports: true,
                                pos_access: true,
                                manage_staff: true,
                                manage_settings: true,
                              },
                            })
                          }
                        >
                          Full Access
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleAddStaff} className="w-full">
                  Add Staff
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-success">+2 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Staff
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staff.filter((s) => s.active).length}
              </div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Salary
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {staff.length > 0
                  ? (
                      staff.reduce((sum, s) => sum + (s.salary || 0), 0) /
                      staff.length
                    ).toFixed(0)
                  : "0"}
              </div>
              <p className="text-xs text-muted-foreground">Per month</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Staff Database</CardTitle>
                <CardDescription>
                  Manage staff information and details
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Working Hours</TableHead>
                  <TableHead>Portal Access</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  console.log(
                    `Staff member ${member.name}: can_login = ${member.can_login}`
                  );
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {member.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            {member.email || "No email"}
                          </div>
                          <div className="text-sm">
                            {member.phone || "No phone"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(member.salary || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>
                            {member.working_hours
                              ? "Custom Schedule"
                              : "Default Schedule"}
                          </span>
                          {member.working_hours && (
                            <Badge variant="secondary" className="text-xs">
                              Set
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant={member.can_login ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {member.portal_access || "staff"}
                          </Badge>
                          {member.can_login && (
                            <div className="text-xs text-green-600">
                              ✓ Login Enabled
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            member.active
                              ? "bg-success text-success-foreground"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {member.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {member.notes || "No notes"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openScheduleDialog(member)}
                          >
                            <Clock className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPermissionsDialog(member)}
                          >
                            <Shield className="h-3 w-3" />
                          </Button>
                          {/* Debug: Show button is rendered */}
                          <span className="text-xs text-blue-500">PERM</span>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openDeleteDialog(member.id!)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Staff Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {member.name}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteStaff}
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Staff Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information
              </DialogDescription>
            </DialogHeader>
            {editingStaff && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Staff name"
                    value={editingStaff.name}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="staff@email.com"
                      value={editingStaff.email || ""}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="+1-555-0000"
                      value={editingStaff.phone || ""}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Salary ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={editingStaff.salary || ""}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          salary: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <Input
                      placeholder="Mon-Fri 9AM-6PM"
                      value={editingStaff.working_hours || ""}
                      onChange={(e) =>
                        setEditingStaff({
                          ...editingStaff,
                          working_hours: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Staff notes, skills, etc."
                    value={editingStaff.notes || ""}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={editingStaff.active}
                    onChange={(e) =>
                      setEditingStaff({
                        ...editingStaff,
                        active: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="active">Active Staff Member</Label>
                </div>
                <Button onClick={handleEditStaff} className="w-full">
                  Update Staff
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Staff Schedule Manager */}
        {selectedStaffForSchedule && (
          <StaffScheduleManager
            isOpen={isScheduleDialogOpen}
            onClose={() => {
              setIsScheduleDialogOpen(false);
              setSelectedStaffForSchedule(null);
            }}
            staffId={selectedStaffForSchedule.id!}
            staffName={selectedStaffForSchedule.name}
            onScheduleUpdated={() => {
              // Refresh staff list to show updated working hours
              const fetchStaff = async () => {
                try {
                  const response = await staffService.getStaff();
                  if (response.success) {
                    setStaff(response.data);
                  }
                } catch (error) {
                  console.error("Error refreshing staff:", error);
                }
              };
              fetchStaff();
            }}
          />
        )}

        {/* Staff Permissions Dialog */}
        <Dialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Staff Permissions</DialogTitle>
              <DialogDescription>
                Manage permissions for {selectedStaffForPermissions?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedStaffForPermissions && (
              <div className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium text-sm">Section Permissions</h3>
                  <p className="text-sm text-gray-600">
                    Choose which sections this staff member can access
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_view_dashboard"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.view_dashboard || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              view_dashboard: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_view_dashboard" className="text-sm">
                        Dashboard
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_bookings"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_bookings || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_bookings: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_manage_bookings" className="text-sm">
                        Bookings
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_customers"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_customers || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_customers: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label
                        htmlFor="edit_manage_customers"
                        className="text-sm"
                      >
                        Customers
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_products"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_products || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_products: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_manage_products" className="text-sm">
                        Products
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_services"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_services || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_services: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_manage_services" className="text-sm">
                        Services
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_view_reports"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.view_reports || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              view_reports: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_view_reports" className="text-sm">
                        Reports
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_pos_access"
                        checked={
                          selectedStaffForPermissions.permissions?.pos_access ||
                          false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              pos_access: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_pos_access" className="text-sm">
                        POS
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_staff"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_staff || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_staff: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_manage_staff" className="text-sm">
                        Manage Staff
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit_manage_settings"
                        checked={
                          selectedStaffForPermissions.permissions
                            ?.manage_settings || false
                        }
                        onChange={(e) =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              ...selectedStaffForPermissions.permissions,
                              manage_settings: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-slate-800 focus:ring-slate-800"
                      />
                      <Label htmlFor="edit_manage_settings" className="text-sm">
                        Settings
                      </Label>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Quick Presets:</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              view_dashboard: true,
                              manage_bookings: true,
                              manage_customers: true,
                              manage_products: true,
                              manage_services: true,
                              view_reports: true,
                              pos_access: true,
                              manage_staff: false,
                              manage_settings: false,
                            },
                          })
                        }
                      >
                        Standard Staff
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              view_dashboard: true,
                              manage_bookings: false,
                              manage_customers: false,
                              manage_products: false,
                              manage_services: false,
                              view_reports: false,
                              pos_access: true,
                              manage_staff: false,
                              manage_settings: false,
                            },
                          })
                        }
                      >
                        Cashier Only
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedStaffForPermissions({
                            ...selectedStaffForPermissions,
                            permissions: {
                              view_dashboard: true,
                              manage_bookings: true,
                              manage_customers: true,
                              manage_products: true,
                              manage_services: true,
                              view_reports: true,
                              pos_access: true,
                              manage_staff: true,
                              manage_settings: true,
                            },
                          })
                        }
                      >
                        Full Access
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPermissionsDialogOpen(false);
                      setSelectedStaffForPermissions(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePermissions} className="flex-1">
                    Update Permissions
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Staff;
