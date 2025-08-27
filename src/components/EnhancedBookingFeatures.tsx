import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Repeat, Users, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  bookingService,
  TimeSlot,
  StaffSchedule,
  RecurringBooking,
} from "@/services/bookings";
import { customerService, Customer } from "@/services/customers";
import { staffService, Staff } from "@/services/staff";
import { serviceService, Service } from "@/services/services";

interface EnhancedBookingFeaturesProps {
  onBookingCreated: () => void;
}

export const EnhancedBookingFeatures: React.FC<
  EnhancedBookingFeaturesProps
> = ({ onBookingCreated }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Dialog states
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showStaffScheduleDialog, setShowStaffScheduleDialog] = useState(false);
  const [showTimeSlotDialog, setShowTimeSlotDialog] = useState(false);

  // Form states
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

  const [timeSlotFilters, setTimeSlotFilters] = useState({
    service_id: "",
    staff_id: "",
    date: selectedDate,
  });

  const { toast } = useToast();

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, staffRes, servicesRes] = await Promise.all([
          customerService.getCustomers(),
          staffService.getStaff(),
          serviceService.getServices(),
        ]);

        if (customersRes.success) setCustomers(customersRes.data);
        if (staffRes.success) setStaff(staffRes.data);
        if (servicesRes.success) setServices(servicesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

  // Fetch available time slots
  const fetchAvailableTimeSlots = async (
    date: string,
    serviceId: string,
    staffId?: string
  ) => {
    try {
      const response = await bookingService.getAvailableTimeSlots(
        date,
        parseInt(serviceId),
        staffId && staffId !== "any" ? parseInt(staffId) : undefined
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

  // Fetch staff schedules
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

  // Create recurring booking
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
        onBookingCreated();
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

  // Send notification
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

  return (
    <>
      {/* Enhanced Action Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setShowStaffScheduleDialog(true);
            fetchStaffSchedules(selectedDate);
          }}
        >
          <Users className="mr-2 h-4 w-4" />
          Staff Schedules
        </Button>
        <Button variant="outline" onClick={() => setShowRecurringDialog(true)}>
          <Repeat className="mr-2 h-4 w-4" />
          Recurring Booking
        </Button>
        <Button variant="outline" onClick={() => setShowTimeSlotDialog(true)}>
          <Clock className="mr-2 h-4 w-4" />
          Time Slots
        </Button>
      </div>

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
                onValueChange={(value) => {
                  const service = services.find(
                    (s) => s.id.toString() === value
                  );
                  setRecurringBooking((prev) => ({
                    ...prev,
                    service_id: parseInt(value),
                    duration: service?.duration || 0,
                    price: service?.price || 0,
                  }));
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle>Staff Schedules</DialogTitle>
            <DialogDescription>
              View staff availability and schedules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {staffSchedules.map((schedule) => (
                <Card key={schedule.staff_id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {schedule.staff_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Staff Member
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          schedule.available_slots.filter(
                            (slot) => slot.is_available
                          ).length > 0
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs font-medium"
                      >
                        {
                          schedule.available_slots.filter(
                            (slot) => slot.is_available
                          ).length
                        }{" "}
                        slots
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Working Hours Section */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Working Hours
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {schedule.working_hours.map((day) => (
                            <div
                              key={day.day}
                              className={`flex items-center justify-between p-2 rounded-md border text-xs ${
                                day.is_working
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    day.is_working
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                ></div>
                                <span className="font-medium text-gray-700 capitalize">
                                  {day.day}
                                </span>
                              </div>
                              <div className="text-right">
                                {day.is_working ? (
                                  <div>
                                    <div className="font-semibold text-green-700 text-xs">
                                      {day.start_time}-{day.end_time}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-500 font-medium text-xs">
                                    Off
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Available Slots Section */}
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold text-gray-900 text-sm">
                            Available Slots for {selectedDate}
                          </h3>
                        </div>
                        {schedule.available_slots.filter(
                          (slot) => slot.is_available
                        ).length > 0 ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-1">
                              {schedule.available_slots
                                .filter((slot) => slot.is_available)
                                .slice(0, 12)
                                .map((slot) => (
                                  <Badge
                                    key={slot.id}
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors py-1"
                                  >
                                    {slot.start_time}
                                  </Badge>
                                ))}
                            </div>
                            {schedule.available_slots.filter(
                              (slot) => slot.is_available
                            ).length > 12 && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                                +
                                {schedule.available_slots.filter(
                                  (slot) => slot.is_available
                                ).length - 12}{" "}
                                more slots
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 rounded-lg">
                            <Calendar className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <div className="text-xs text-gray-600">
                              No available slots
                            </div>
                            <div className="text-xs text-gray-500">
                              Not working on this day
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="text-center">
                          <div className="text-sm font-semibold text-blue-600">
                            {
                              schedule.working_hours.filter(
                                (day) => day.is_working
                              ).length
                            }
                          </div>
                          <div className="text-xs text-gray-600">
                            Working Days
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-green-600">
                            {
                              schedule.available_slots.filter(
                                (slot) => slot.is_available
                              ).length
                            }
                          </div>
                          <div className="text-xs text-gray-600">
                            Available Slots
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Slot Dialog */}
      <Dialog open={showTimeSlotDialog} onOpenChange={setShowTimeSlotDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Available Time Slots</DialogTitle>
            <DialogDescription>
              Check available time slots for a specific date and service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="slot_date">Date</Label>
                <Input
                  type="date"
                  value={timeSlotFilters.date}
                  onChange={(e) => {
                    setTimeSlotFilters((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }));
                    if (e.target.value && timeSlotFilters.service_id) {
                      fetchAvailableTimeSlots(
                        e.target.value,
                        timeSlotFilters.service_id,
                        timeSlotFilters.staff_id
                      );
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="slot_service">Service</Label>
                <Select
                  value={timeSlotFilters.service_id}
                  onValueChange={(value) => {
                    setTimeSlotFilters((prev) => ({
                      ...prev,
                      service_id: value,
                    }));
                    if (timeSlotFilters.date && value) {
                      fetchAvailableTimeSlots(
                        timeSlotFilters.date,
                        value,
                        timeSlotFilters.staff_id
                      );
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
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
                <Label htmlFor="slot_staff">Staff (Optional)</Label>
                <Select
                  value={timeSlotFilters.staff_id}
                  onValueChange={(value) => {
                    setTimeSlotFilters((prev) => ({
                      ...prev,
                      staff_id: value,
                    }));
                    if (timeSlotFilters.date && timeSlotFilters.service_id) {
                      fetchAvailableTimeSlots(
                        timeSlotFilters.date,
                        timeSlotFilters.service_id,
                        value
                      );
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any staff</SelectItem>
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
            </div>
            <div className="space-y-4">
              <div className="text-sm font-medium">
                Available Time Slots for {timeSlotFilters.date}:
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableTimeSlots.map((slot) => (
                  <Badge
                    key={slot.id}
                    variant={slot.is_available ? "default" : "secondary"}
                    className={`p-2 text-center ${
                      !slot.is_available ? "opacity-50" : ""
                    }`}
                  >
                    <div className="text-xs">
                      <div>{slot.start_time}</div>
                      {slot.staff_id && (
                        <div className="text-xs opacity-75">
                          Staff:{" "}
                          {staff.find((s) => s.id === slot.staff_id)?.name ||
                            "Unknown"}
                        </div>
                      )}
                    </div>
                  </Badge>
                ))}
              </div>
              {availableTimeSlots.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No available time slots for the selected criteria
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
