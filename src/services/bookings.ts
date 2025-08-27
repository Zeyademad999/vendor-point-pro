import { apiService } from "./api";

export interface Booking {
  id?: number;
  service_id: number;
  customer_id?: number;
  staff_id?: number;
  booking_date: string;
  booking_time: string;
  duration: number;
  price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  payment_status: "pending" | "paid" | "refunded";
  notes?: string;
  staff_preference?: "any" | "specific";
  created_at?: string;
  updated_at?: string;
  // Joined fields from related tables
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_name?: string;
  service_duration?: number;
  staff_name?: string;
  // Enhanced fields
  is_recurring?: boolean;
  recurring_pattern?: "weekly" | "biweekly" | "monthly";
  recurring_end_date?: string;
  parent_booking_id?: number;
}

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  staff_id?: number;
  service_id?: number;
}

export interface StaffSchedule {
  staff_id: number;
  staff_name: string;
  working_hours: {
    day: string;
    start_time: string;
    end_time: string;
    is_working: boolean;
  }[];
  available_slots: TimeSlot[];
}

export interface RecurringBooking {
  service_id: number;
  customer_id: number;
  staff_id: number;
  start_date: string;
  start_time: string;
  duration: number;
  price: number;
  recurring_pattern: "weekly" | "biweekly" | "monthly";
  recurring_end_date: string;
  notes?: string;
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  date?: string;
  staff_id?: number;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface BookingResponse {
  success: boolean;
  data: Booking[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BookingAnalytics {
  success: boolean;
  data: {
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    confirmationRate: string;
    bookingsByStatus: Array<{
      status: string;
      count: number;
    }>;
    topServices: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
  };
}

export const bookingService = {
  // Get all bookings with filters
  getBookings: async (
    filters: BookingFilters = {}
  ): Promise<BookingResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<BookingResponse>(
      `/bookings?${params.toString()}`
    );
    return response;
  },

  // Get single booking by ID
  getBooking: async (
    id: number
  ): Promise<{ success: boolean; data: Booking }> => {
    const response = await apiService.get<{ success: boolean; data: Booking }>(
      `/bookings/${id}`
    );
    return response;
  },

  // Create new booking
  createBooking: async (
    booking: Omit<Booking, "id" | "created_at" | "updated_at">
  ): Promise<{ success: boolean; message: string; data: Booking }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Booking;
    }>("/bookings", booking);
    return response;
  },

  // Update booking
  updateBooking: async (
    id: number,
    booking: Partial<Booking>
  ): Promise<{ success: boolean; message: string; data: Booking }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Booking;
    }>(`/bookings/${id}`, booking);
    return response;
  },

  // Delete booking
  deleteBooking: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/bookings/${id}`);
    return response;
  },

  // Get booking analytics
  getAnalytics: async (): Promise<BookingAnalytics> => {
    const response = await apiService.get<BookingAnalytics>(
      "/bookings/analytics"
    );
    return response;
  },

  // Get available time slots for a specific date and service
  getAvailableTimeSlots: async (
    date: string,
    service_id: number,
    staff_id?: number
  ): Promise<{ success: boolean; data: TimeSlot[] }> => {
    const params = new URLSearchParams({
      date,
      service_id: service_id.toString(),
    });
    if (staff_id) {
      params.append("staff_id", staff_id.toString());
    }

    const response = await apiService.get<{
      success: boolean;
      data: TimeSlot[];
    }>(`/bookings/time-slots?${params.toString()}`);
    return response;
  },

  // Get staff schedules
  getStaffSchedules: async (
    date?: string
  ): Promise<{ success: boolean; data: StaffSchedule[] }> => {
    const params = new URLSearchParams();
    if (date) {
      params.append("date", date);
    }

    const response = await apiService.get<{
      success: boolean;
      data: StaffSchedule[];
    }>(`/bookings/staff-schedules?${params.toString()}`);
    return response;
  },

  // Create recurring booking
  createRecurringBooking: async (
    recurringBooking: RecurringBooking
  ): Promise<{ success: boolean; message: string; data: Booking[] }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Booking[];
    }>("/bookings/recurring", recurringBooking);
    return response;
  },

  // Send booking notification
  sendNotification: async (
    booking_id: number,
    notification_type: "confirmation" | "reminder" | "cancellation"
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
    }>(`/bookings/${booking_id}/notifications`, {
      type: notification_type,
    });
    return response;
  },

  // Get booking conflicts
  checkConflicts: async (
    date: string,
    time: string,
    duration: number,
    staff_id?: number
  ): Promise<{
    success: boolean;
    data: { has_conflicts: boolean; conflicts: Booking[] };
  }> => {
    const params = new URLSearchParams({
      date,
      time,
      duration: duration.toString(),
    });
    if (staff_id) {
      params.append("staff_id", staff_id.toString());
    }

    const response = await apiService.get<{
      success: boolean;
      data: { has_conflicts: boolean; conflicts: Booking[] };
    }>(`/bookings/check-conflicts?${params.toString()}`);
    return response;
  },

  // Create customer booking from website (public endpoint)
  createCustomerBooking: async (booking: {
    service_id: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    booking_date: string;
    booking_time: string;
    notes?: string;
    client_id: number;
    staff_preference?: "any" | "specific";
    staff_id?: number;
  }): Promise<{ success: boolean; message: string; data: Booking }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Booking;
    }>("/bookings/customer", booking);
    return response;
  },
};
