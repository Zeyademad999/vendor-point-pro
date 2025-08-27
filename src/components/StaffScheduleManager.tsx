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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffService } from "@/services/staff";

interface WorkingHours {
  day: string;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

interface StaffSchedule {
  staff_id: number;
  staff_name: string;
  working_hours: WorkingHours[];
  available_slots: Array<{
    id: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    staff_id: number;
  }>;
}

interface StaffScheduleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: number;
  staffName: string;
  onScheduleUpdated: () => void;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_WORKING_HOURS: WorkingHours[] = DAYS_OF_WEEK.map((day) => ({
  day: day.key,
  start_time: "09:00",
  end_time: "18:00",
  is_working: day.key !== "sunday",
}));

export const StaffScheduleManager: React.FC<StaffScheduleManagerProps> = ({
  isOpen,
  onClose,
  staffId,
  staffName,
  onScheduleUpdated,
}) => {
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(
    DEFAULT_WORKING_HOURS
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && staffId) {
      loadStaffSchedule();
    }
  }, [isOpen, staffId]);

  const loadStaffSchedule = async () => {
    try {
      setLoading(true);
      console.log("Loading schedule for staff", staffId);

      const response = await staffService.getStaffSchedule(staffId);
      console.log("Load schedule response:", response);

      if (response.success && response.data.working_hours) {
        setWorkingHours(response.data.working_hours);
      } else {
        console.log("No custom working hours found, using defaults");
        setWorkingHours(DEFAULT_WORKING_HOURS);
      }
    } catch (error) {
      console.error("Error loading staff schedule:", error);
      // Use default working hours if loading fails
      setWorkingHours(DEFAULT_WORKING_HOURS);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursChange = (
    dayKey: string,
    field: keyof WorkingHours,
    value: any
  ) => {
    setWorkingHours((prev) =>
      prev.map((day) => (day.day === dayKey ? { ...day, [field]: value } : day))
    );
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);

      console.log("Saving schedule for staff", staffId, ":", workingHours);

      // Save working hours to staff record
      const response = await staffService.updateStaff(staffId, {
        working_hours: JSON.stringify(workingHours),
      });

      console.log("Update response:", response);

      if (response.success) {
        toast({
          title: "Schedule Updated",
          description: `${staffName}'s schedule has been updated successfully.`,
        });
        onScheduleUpdated();
        onClose();
      } else {
        throw new Error(response.message || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update staff schedule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getDayStatusColor = (isWorking: boolean) => {
    return isWorking
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-600";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {staffName}'s Schedule
          </DialogTitle>
          <DialogDescription>
            Manage working hours and availability for {staffName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Working Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySchedule = workingHours.find(
                      (d) => d.day === day.key
                    );
                    if (!daySchedule) return null;

                    return (
                      <div
                        key={day.key}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <div className="w-24">
                          <Label className="font-medium">{day.label}</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={daySchedule.is_working}
                            onCheckedChange={(checked) =>
                              handleWorkingHoursChange(
                                day.key,
                                "is_working",
                                checked
                              )
                            }
                          />
                          <Badge
                            className={getDayStatusColor(
                              daySchedule.is_working
                            )}
                          >
                            {daySchedule.is_working ? "Working" : "Off"}
                          </Badge>
                        </div>

                        {daySchedule.is_working && (
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm">Start:</Label>
                              <Input
                                type="time"
                                value={daySchedule.start_time}
                                onChange={(e) =>
                                  handleWorkingHoursChange(
                                    day.key,
                                    "start_time",
                                    e.target.value
                                  )
                                }
                                className="w-24"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm">End:</Label>
                              <Input
                                type="time"
                                value={daySchedule.end_time}
                                onChange={(e) =>
                                  handleWorkingHoursChange(
                                    day.key,
                                    "end_time",
                                    e.target.value
                                  )
                                }
                                className="w-24"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySchedule = workingHours.find(
                      (d) => d.day === day.key
                    );
                    if (!daySchedule) return null;

                    return (
                      <div
                        key={day.key}
                        className="text-center p-3 border rounded-lg"
                      >
                        <div className="font-medium text-sm">{day.label}</div>
                        {daySchedule.is_working ? (
                          <div className="text-xs text-green-600 mt-1">
                            {daySchedule.start_time} - {daySchedule.end_time}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">Off</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
