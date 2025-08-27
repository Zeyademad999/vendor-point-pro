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
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService, Staff as StaffType } from "@/services/staff";
import { useAuth } from "@/contexts/AuthContext";

const StaffEnhanced = () => {
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
  });
  const [editingStaff, setEditingStaff] = useState<StaffType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [selectedStaffForCredentials, setSelectedStaffForCredentials] =
    useState<StaffType | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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

  // Filter staff by type
  const staffMembers = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email &&
        member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cashierMembers = staff.filter(
    (member) =>
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email &&
          member.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      member.portal_access === "cashier"
  );

  const adminMembers = staff.filter(
    (member) =>
      (member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email &&
          member.email.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      member.portal_access === "admin"
  );

  const handleAddStaff = async () => {
    try {
      if (!isAuthenticated) {
        toast({
          title: "Error",
          description: "You must be logged in to add staff",
          variant: "destructive",
        });
        return;
      }

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
        phone: newStaff.phone.trim().replace(/[^0-9]/g, ""),
        salary: parseFloat(newStaff.salary) || 0,
        working_hours: newStaff.working_hours.trim(),
        notes: newStaff.notes.trim(),
        active: true,
        hire_date: new Date().toISOString().split("T")[0],
        username: newStaff.username.trim(),
        portal_access: newStaff.portal_access,
        can_login: newStaff.can_login,
        password: newStaff.password,
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

  const handleCreateCredentials = async () => {
    if (!selectedStaffForCredentials) return;

    try {
      const updatedStaff = {
        ...selectedStaffForCredentials,
        username: newStaff.username.trim(),
        can_login: true,
        password: newStaff.password,
      };

      const response = await staffService.updateStaff(
        selectedStaffForCredentials.id!,
        updatedStaff
      );

      if (response.success) {
        setStaff(
          staff.map((s) =>
            s.id === selectedStaffForCredentials.id ? response.data : s
          )
        );
        setCredentialDialogOpen(false);
        setSelectedStaffForCredentials(null);
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
        });
        toast({
          title: "Credentials Created",
          description: `Login credentials created for ${selectedStaffForCredentials.name}`,
        });
      }
    } catch (error) {
      console.error("Error creating credentials:", error);
      toast({
        title: "Error",
        description: "Failed to create credentials",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (staffMember: StaffType) => {
    setEditingStaff(staffMember);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (staffId: number) => {
    setDeletingStaffId(staffId);
  };

  const openCredentialDialog = (staffMember: StaffType) => {
    setSelectedStaffForCredentials(staffMember);
    setNewStaff((prev) => ({
      ...prev,
      portal_access: staffMember.portal_access || "staff",
    }));
    setCredentialDialogOpen(true);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage your staff members and their portal access
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Staff
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
                <Button onClick={handleAddStaff} className="w-full">
                  Add Staff
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Staff Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Members
              </CardTitle>
              <CardDescription>
                Manage staff members and their portal access
              </CardDescription>
            </div>
            <Badge variant="outline">{staffMembers.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((member) => (
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
                    <div className="flex items-center space-x-2">
                      {!member.can_login && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCredentialDialog(member)}
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Create Credentials
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
                              onClick={() => {
                                // Handle delete
                                setDeletingStaffId(null);
                              }}
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

      {/* Cashier Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Cashier Members
              </CardTitle>
              <CardDescription>
                Manage cashier members and their POS access
              </CardDescription>
            </div>
            <Badge variant="outline">{cashierMembers.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashierMembers.map((member) => (
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
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={member.can_login ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {member.portal_access || "cashier"}
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
                    <div className="flex items-center space-x-2">
                      {!member.can_login && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCredentialDialog(member)}
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Create Credentials
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
                              Delete Cashier Member
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {member.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                // Handle delete
                                setDeletingStaffId(null);
                              }}
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

      {/* Admin Members Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Admin Members
              </CardTitle>
              <CardDescription>
                Manage admin members and their system access
              </CardDescription>
            </div>
            <Badge variant="outline">{adminMembers.length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Portal Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminMembers.map((member) => (
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
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant={member.can_login ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {member.portal_access || "admin"}
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
                    <div className="flex items-center space-x-2">
                      {!member.can_login && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCredentialDialog(member)}
                        >
                          <Key className="h-3 w-3 mr-1" />
                          Create Credentials
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
                              Delete Admin Member
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {member.name}?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                // Handle delete
                                setDeletingStaffId(null);
                              }}
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

      {/* Credentials Dialog */}
      <Dialog
        open={credentialDialogOpen}
        onOpenChange={setCredentialDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Create Login Credentials for {selectedStaffForCredentials?.name}
            </DialogTitle>
            <DialogDescription>
              Set up username and password for portal access
            </DialogDescription>
          </DialogHeader>
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
            <Button onClick={handleCreateCredentials} className="w-full">
              Create Credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffEnhanced;
