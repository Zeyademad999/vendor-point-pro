import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Loader2,
  CalendarDays,
  List,
  Grid3X3,
  Repeat,
  Bell,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bookingService,
  Booking as BookingType,
  TimeSlot,
  StaffSchedule,
  RecurringBooking,
} from "@/services/bookings";
import { customerService, Customer } from "@/services/customers";
import { staffService, Staff } from "@/services/staff";
import { serviceService, Service } from "@/services/services";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { EnhancedBookingFeatures } from "@/components/EnhancedBookingFeatures";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Bookings = () => {
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [analytics, setAnalytics] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [newBooking, setNewBooking] = useState({
    service_id: "",
    customer_id: "",
    staff_id: "",
    booking_date: "",
    booking_time: "",
    notes: "",
  });
  const [editingBooking, setEditingBooking] = useState<BookingType | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(
    null
  );

  // Enhanced booking features
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [isRecurringBooking, setIsRecurringBooking] = useState(false);
  const [recurringBooking, setRecurringBooking] = useState<RecurringBooking>({
    service_id: 0,
    customer_id: 0,
    staff_id: 0,
    start_date: "",
    start_time: "",
    duration: 0,
    price: 0,
    recurring_pattern: "weekly",
    recurring_end_date: "",
    notes: "",
  });
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showStaffScheduleDialog, setShowStaffScheduleDialog] = useState(false);
  const [showStaffScheduleModal, setShowStaffScheduleModal] = useState(false);
  const [selectedStaffSchedule, setSelectedStaffSchedule] =
    useState<StaffSchedule | null>(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] =
    useState<BookingType | null>(null);

  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookingsRes, customersRes, staffRes, servicesRes, analyticsRes] =
          await Promise.all([
            bookingService.getBookings(),
            customerService.getCustomers(),
            staffService.getStaff(),
            serviceService.getServices(),
            bookingService.getAnalytics(),
          ]);

        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
        }
        if (customersRes.success) {
          setCustomers(customersRes.data);
        }
        if (staffRes.success) {
          setStaff(staffRes.data);
        }
        if (servicesRes.success) {
          setServices(servicesRes.data);
        }
        if (analyticsRes.success) {
          setAnalytics(analyticsRes.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch bookings data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Convert bookings to calendar events
  const calendarEvents = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.customer_name} - ${booking.service_name}`,
      start: new Date(`${booking.booking_date}T${booking.booking_time}`),
      end: new Date(`${booking.booking_date}T${booking.booking_time}`),
      resource: booking,
      status: booking.status,
      staff: booking.staff_name,
      customer: booking.customer_name,
      service: booking.service_name,
    }));
  }, [bookings]);

  const filteredBookings = bookings.filter(
    (booking) =>
      (booking.customer_name &&
        booking.customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (booking.service_name &&
        booking.service_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (booking.staff_name &&
        booking.staff_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todayBookings = bookings.filter(
    (booking) => booking.booking_date === selectedDate
  );
  const upcomingBookings = bookings.filter(
    (booking) =>
      new Date(booking.booking_date) > new Date() &&
      booking.status !== "cancelled"
  );
  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
  );

  // Enhanced booking functions
  const fetchAvailableTimeSlots = async (
    date: string,
    serviceId: string,
    staffId?: string
  ) => {
    try {
      const response = await bookingService.getAvailableTimeSlots(
        date,
        parseInt(serviceId),
        staffId ? parseInt(staffId) : undefined
      );
      if (response.success) {
        setAvailableTimeSlots(response.data);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available time slots",
        variant: "destructive",
      });
    }
  };

  const fetchStaffSchedules = async (date?: string) => {
    try {
      const response = await bookingService.getStaffSchedules(date);
      if (response.success) {
        setStaffSchedules(response.data);
      }
    } catch (error) {
      console.error("Error fetching staff schedules:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff schedules",
        variant: "destructive",
      });
    }
  };

  const createRecurringBooking = async () => {
    try {
      const response = await bookingService.createRecurringBooking(
        recurringBooking
      );
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
        setShowRecurringDialog(false);
        // Refresh bookings
        const bookingsRes = await bookingService.getBookings();
        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
        }
      }
    } catch (error) {
      console.error("Error creating recurring booking:", error);
      toast({
        title: "Error",
        description: "Failed to create recurring booking",
        variant: "destructive",
      });
    }
  };

  const sendNotification = async (
    bookingId: number,
    type: "confirmation" | "reminder" | "cancellation"
  ) => {
    try {
      const response = await bookingService.sendNotification(bookingId, type);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message,
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo.start);
    setNewBooking((prev) => ({
      ...prev,
      booking_date: slotInfo.start.toISOString().split("T")[0],
      booking_time: slotInfo.start.toTimeString().slice(0, 5),
    }));
    setIsDialogOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedBookingForDetails(event.resource);
    setShowBookingDetailsModal(true);
  };

  const handleCreateBooking = async () => {
    try {
      const selectedService = services.find(
        (s) => s.id.toString() === newBooking.service_id
      );
      const bookingData = {
        service_id: parseInt(newBooking.service_id),
        customer_id: newBooking.customer_id
          ? parseInt(newBooking.customer_id)
          : undefined,
        staff_id: newBooking.staff_id
          ? parseInt(newBooking.staff_id)
          : undefined,
        booking_date: newBooking.booking_date,
        booking_time: newBooking.booking_time,
        duration: selectedService?.duration || 60,
        price: selectedService?.price || 0,
        notes: newBooking.notes,
        status: "pending" as const,
        payment_status: "pending" as const,
      };

      const response = await bookingService.createBooking(bookingData);
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking created successfully",
        });
        setIsDialogOpen(false);
        setNewBooking({
          service_id: "",
          customer_id: "",
          staff_id: "",
          booking_date: "",
          booking_time: "",
          notes: "",
        });

        // Refresh bookings
        const bookingsRes = await bookingService.getBookings();
        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
        }
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;

    try {
      const selectedService = services.find(
        (s) => s.id.toString() === editingBooking.service_id.toString()
      );
      const updateData = {
        service_id: editingBooking.service_id,
        customer_id: editingBooking.customer_id || undefined,
        staff_id: editingBooking.staff_id || undefined,
        booking_date: editingBooking.booking_date,
        booking_time: editingBooking.booking_time,
        duration: selectedService?.duration || 60,
        price: editingBooking.price,
        status: editingBooking.status,
        payment_status: editingBooking.payment_status,
        notes: editingBooking.notes,
      };

      const response = await bookingService.updateBooking(
        editingBooking.id!,
        updateData
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking updated successfully",
        });
        setIsEditDialogOpen(false);
        setEditingBooking(null);

        // Refresh bookings
        const bookingsRes = await bookingService.getBookings();
        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
        }
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async () => {
    if (!deletingBookingId) return;

    try {
      const response = await bookingService.deleteBooking(deletingBookingId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Booking deleted successfully",
        });
        setDeletingBookingId(null);

        // Refresh bookings
        const bookingsRes = await bookingService.getBookings();
        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
        }
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#3b82f6"; // default blue

    switch (event.status) {
      case "confirmed":
        backgroundColor = "#10b981"; // green
        break;
      case "pending":
        backgroundColor = "#f59e0b"; // yellow
        break;
      case "cancelled":
        backgroundColor = "#ef4444"; // red
        break;
      case "completed":
        backgroundColor = "#6366f1"; // indigo
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Manage appointments and schedules
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <EnhancedBookingFeatures
            onBookingCreated={() => {
              // Refresh bookings
              const fetchData = async () => {
                const bookingsRes = await bookingService.getBookings();
                if (bookingsRes.success) {
                  setBookings(bookingsRes.data);
                }
              };
              fetchData();
            }}
          />
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.totalBookings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newBookingsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Bookings
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingBookings.length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics?.totalRevenue || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.confirmationRate || "0%"} confirmation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "list" | "calendar")}
          >
            <TabsList>
              <TabsTrigger
                value="calendar"
                className="flex items-center space-x-2"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center space-x-2">
                <List className="h-4 w-4" />
                <span>List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardContent className="p-6">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day"]}
              defaultView="week"
              step={30}
              timeslots={2}
              tooltipAccessor={(event) => {
                const booking = event.resource;
                return `${booking.customer_name} - ${booking.service_name}
Staff: ${booking.staff_name || "Not assigned"}
Time: ${booking.booking_time}
Status: ${booking.status}
Payment: ${booking.payment_status}`;
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>
              Manage and view all bookings in a list format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.customer_name}
                    </TableCell>
                    <TableCell>{booking.service_name}</TableCell>
                    <TableCell>{booking.staff_name}</TableCell>
                    <TableCell>
                      {new Date(booking.booking_date).toLocaleDateString()} at{" "}
                      {booking.booking_time}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBookingForDetails(booking);
                            setShowBookingDetailsModal(true);
                          }}
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            sendNotification(booking.id!, "reminder")
                          }
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBooking(booking);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingBookingId(booking.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Booking
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this booking?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteBooking}>
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
      )}

      {/* New Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Service</Label>
              <Select
                value={newBooking.service_id}
                onValueChange={(value) => {
                  setNewBooking((prev) => ({ ...prev, service_id: value }));
                  if (newBooking.booking_date && value) {
                    fetchAvailableTimeSlots(
                      newBooking.booking_date,
                      value,
                      newBooking.staff_id
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={newBooking.customer_id}
                onValueChange={(value) =>
                  setNewBooking((prev) => ({ ...prev, customer_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="staff">Staff</Label>
              <Select
                value={newBooking.staff_id}
                onValueChange={(value) => {
                  setNewBooking((prev) => ({ ...prev, staff_id: value }));
                  if (
                    newBooking.booking_date &&
                    newBooking.service_id &&
                    value
                  ) {
                    fetchAvailableTimeSlots(
                      newBooking.booking_date,
                      newBooking.service_id,
                      value
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((staffMember) => (
                    <SelectItem
                      key={staffMember.id}
                      value={staffMember.id.toString()}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{staffMember.name}</span>
                        {staffMember.working_hours && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Custom Schedule
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newBooking.staff_id && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={async () => {
                      try {
                        const response = await bookingService.getStaffSchedules(
                          newBooking.booking_date
                        );
                        if (response.success) {
                          const staffSchedule = response.data.find(
                            (schedule) =>
                              schedule.staff_id ===
                              parseInt(newBooking.staff_id)
                          );
                          if (staffSchedule) {
                            setSelectedStaffSchedule(staffSchedule);
                            setShowStaffScheduleModal(true);
                          }
                        }
                      } catch (error) {
                        console.error("Error fetching staff schedule:", error);
                      }
                    }}
                  >
                    View staff schedule for {newBooking.booking_date}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                value={newBooking.booking_date}
                onChange={(e) => {
                  setNewBooking((prev) => ({
                    ...prev,
                    booking_date: e.target.value,
                  }));
                  if (e.target.value && newBooking.service_id) {
                    fetchAvailableTimeSlots(
                      e.target.value,
                      newBooking.service_id,
                      newBooking.staff_id
                    );
                  }
                }}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Select
                value={newBooking.booking_time}
                onValueChange={(value) =>
                  setNewBooking((prev) => ({ ...prev, booking_time: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots
                    .filter((slot) => slot.is_available)
                    .map((slot) => (
                      <SelectItem key={slot.id} value={slot.start_time}>
                        {slot.start_time} - {slot.end_time}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                value={newBooking.notes}
                onChange={(e) =>
                  setNewBooking((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBooking}>Create Booking</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>Update the booking details.</DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  value={editingBooking.service_id.toString()}
                  onValueChange={(value) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, service_id: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={editingBooking.customer_id?.toString() || ""}
                  onValueChange={(value) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, customer_id: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="staff">Staff</Label>
                <Select
                  value={editingBooking.staff_id?.toString() || ""}
                  onValueChange={(value) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, staff_id: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((staffMember) => (
                      <SelectItem
                        key={staffMember.id}
                        value={staffMember.id.toString()}
                      >
                        {staffMember.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  type="date"
                  value={editingBooking.booking_date}
                  onChange={(e) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, booking_date: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  type="time"
                  value={editingBooking.booking_time}
                  onChange={(e) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, booking_time: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingBooking.status}
                  onValueChange={(value) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, status: value as any } : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={editingBooking.notes || ""}
                  onChange={(e) =>
                    setEditingBooking((prev) =>
                      prev ? { ...prev, notes: e.target.value } : null
                    )
                  }
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBooking}>Update Booking</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Booking Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Recurring Booking</DialogTitle>
            <DialogDescription>
              Create multiple bookings with a recurring pattern.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service">Service</Label>
              <Select
                value={recurringBooking.service_id.toString()}
                onValueChange={(value) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    service_id: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={recurringBooking.customer_id.toString()}
                onValueChange={(value) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    customer_id: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="staff">Staff</Label>
              <Select
                value={recurringBooking.staff_id.toString()}
                onValueChange={(value) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    staff_id: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((staffMember) => (
                    <SelectItem
                      key={staffMember.id}
                      value={staffMember.id.toString()}
                    >
                      {staffMember.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                type="date"
                value={recurringBooking.start_date}
                onChange={(e) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                type="time"
                value={recurringBooking.start_time}
                onChange={(e) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="recurring_pattern">Recurring Pattern</Label>
              <Select
                value={recurringBooking.recurring_pattern}
                onValueChange={(value) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    recurring_pattern: value as any,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recurring_end_date">End Date</Label>
              <Input
                type="date"
                value={recurringBooking.recurring_end_date}
                onChange={(e) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    recurring_end_date: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                value={recurringBooking.notes || ""}
                onChange={(e) =>
                  setRecurringBooking((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowRecurringDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createRecurringBooking}>
              Create Recurring Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Schedule Dialog */}
      <Dialog
        open={showStaffScheduleDialog}
        onOpenChange={setShowStaffScheduleDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Staff Schedules</DialogTitle>
            <DialogDescription>
              View staff availability and schedules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="schedule_date">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchStaffSchedules(e.target.value);
                }}
              />
              <Button onClick={() => fetchStaffSchedules(selectedDate)}>
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffSchedules.map((schedule) => (
                <Card key={schedule.staff_id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {schedule.staff_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Available Slots:
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {schedule.available_slots
                          .filter((slot) => slot.is_available)
                          .slice(0, 8)
                          .map((slot) => (
                            <Badge
                              key={slot.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {slot.start_time}
                            </Badge>
                          ))}
                      </div>
                      {schedule.available_slots.filter(
                        (slot) => slot.is_available
                      ).length > 8 && (
                        <div className="text-xs text-muted-foreground">
                          +
                          {schedule.available_slots.filter(
                            (slot) => slot.is_available
                          ).length - 8}{" "}
                          more slots
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Staff Schedule Modal */}
      <Dialog
        open={showStaffScheduleModal}
        onOpenChange={setShowStaffScheduleModal}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 -mx-6 -mt-6 px-6 pt-6 pb-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {selectedStaffSchedule?.staff_name}'s Schedule
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Working hours and availability for {newBooking.booking_date}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedStaffSchedule && (
            <div className="space-y-6 pt-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Working Hours Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Weekly Working Hours
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedStaffSchedule.working_hours.map((day) => (
                    <div
                      key={day.day}
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        day.is_working
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            day.is_working ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="font-semibold text-gray-700 capitalize text-sm">
                          {day.day}
                        </span>
                      </div>
                      <div className="text-right">
                        {day.is_working ? (
                          <div>
                            <div className="text-sm font-bold text-green-700">
                              {day.start_time}-{day.end_time}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Working
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 font-semibold text-sm">
                            Day Off
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Slots Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Slots for {newBooking.booking_date}
                  </h3>
                </div>
                {selectedStaffSchedule.available_slots.filter(
                  (slot) => slot.is_available
                ).length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-2">
                      {selectedStaffSchedule.available_slots
                        .filter((slot) => slot.is_available)
                        .map((slot) => (
                          <Badge
                            key={slot.id}
                            variant="outline"
                            className="text-sm py-1.5 px-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors font-medium"
                          >
                            {slot.start_time}
                          </Badge>
                        ))}
                    </div>
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium">
                        Total Available Slots:{" "}
                        {
                          selectedStaffSchedule.available_slots.filter(
                            (slot) => slot.is_available
                          ).length
                        }
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        These are the time slots when{" "}
                        {selectedStaffSchedule.staff_name} is available for
                        bookings
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-base text-gray-600 font-medium">
                      No available slots for this date
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {selectedStaffSchedule.staff_name} is not working on{" "}
                      {newBooking.booking_date}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      selectedStaffSchedule.working_hours.filter(
                        (day) => day.is_working
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Working Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      selectedStaffSchedule.available_slots.filter(
                        (slot) => slot.is_available
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600">Available Slots</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedStaffSchedule.working_hours.filter(
                      (day) => day.is_working
                    ).length > 0
                      ? Math.round(
                          (selectedStaffSchedule.available_slots.filter(
                            (slot) => slot.is_available
                          ).length /
                            (selectedStaffSchedule.working_hours.filter(
                              (day) => day.is_working
                            ).length *
                              18)) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Availability</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Details Modal */}
      <Dialog
        open={showBookingDetailsModal}
        onOpenChange={setShowBookingDetailsModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View detailed information about this booking
            </DialogDescription>
          </DialogHeader>
          {selectedBookingForDetails && (
            <div className="space-y-6">
              {/* Booking Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedBookingForDetails.customer_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedBookingForDetails.service_name}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      selectedBookingForDetails.status === "confirmed"
                        ? "default"
                        : selectedBookingForDetails.status === "pending"
                        ? "secondary"
                        : selectedBookingForDetails.status === "completed"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedBookingForDetails.status}
                  </Badge>
                  <Badge
                    variant={
                      selectedBookingForDetails.payment_status === "paid"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedBookingForDetails.payment_status}
                  </Badge>
                </div>
              </div>

              {/* Booking Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Date & Time</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBookingForDetails.booking_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBookingForDetails.booking_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{selectedBookingForDetails.duration} minutes</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Staff & Service</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedBookingForDetails.staff_name || "Not assigned"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Service:</span>
                      <span>{selectedBookingForDetails.service_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${selectedBookingForDetails.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBookingForDetails.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {selectedBookingForDetails.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setEditingBooking(selectedBookingForDetails);
                    setShowBookingDetailsModal(false);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bookings;
