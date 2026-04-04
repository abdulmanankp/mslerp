import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  LoadingSkeleton,
  useCreatePresidentSchedule,
  useDistricts,
  usePresidentSchedules,
  useUniversities,
  useZones,
} from "@/hooks/useFirebaseData";
import { useAuth } from "@/contexts/useAuth";
import type { ScheduleFrequency, ScheduleTargetType } from "@/types";

export default function PresidentSchedule() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("Daily");
  const [targetType, setTargetType] = useState<ScheduleTargetType>("Zone");
  const [targetId, setTargetId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");

  const { data: schedules = [], isLoading: schedulesLoading } = usePresidentSchedules();
  const { data: zones = [], isLoading: zonesLoading } = useZones();
  const { data: districts = [], isLoading: districtsLoading } = useDistricts();
  const { data: universities = [], isLoading: universitiesLoading } = useUniversities();

  const createSchedule = useCreatePresidentSchedule();

  const targetOptions = useMemo(() => {
    if (targetType === "Zone") {
      return zones.map((z) => ({ id: z.id, name: z.name }));
    }
    if (targetType === "District") {
      return districts.map((d) => ({ id: d.id, name: d.name }));
    }
    return universities.map((u) => ({ id: u.id, name: u.name }));
  }, [targetType, zones, districts, universities]);

  const handleTargetTypeChange = (value: ScheduleTargetType) => {
    setTargetType(value);
    setTargetId("");
  };

  const handleCreateSchedule = async () => {
    if (!title.trim() || !targetId || !scheduleDate) {
      toast({
        title: "Missing fields",
        description: "Title, target, and schedule date are required.",
        variant: "destructive",
      });
      return;
    }

    const selectedTarget = targetOptions.find((item) => item.id === targetId);
    if (!selectedTarget) {
      toast({
        title: "Invalid target",
        description: "Please choose a valid target entity.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSchedule.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        frequency,
        scheduleDate,
        targetType,
        targetId,
        targetName: selectedTarget.name,
        createdBy: user?.id,
      });

      toast({
        title: "Schedule created",
        description: `${frequency} schedule added for ${selectedTarget.name}.`,
      });

      setTitle("");
      setDescription("");
      setFrequency("Daily");
      setTargetType("Zone");
      setTargetId("");
      setScheduleDate("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: "Failed to create schedule",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (schedulesLoading || zonesLoading || districtsLoading || universitiesLoading) {
    return (
      <AppLayout>
        <LoadingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">President Schedule</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Add daily, weekly, and monthly schedules for zones, districts, and universities.
          </p>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add New Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Weekly review with district coordinators"
                />
              </div>

              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(value: ScheduleFrequency) => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select value={targetType} onValueChange={(value: ScheduleTargetType) => handleTargetTypeChange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zone">Zone</SelectItem>
                    <SelectItem value="District">District</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${targetType.toLowerCase()}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {targetOptions.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Add details of this schedule..."
              />
            </div>

            <Button onClick={handleCreateSchedule} disabled={createSchedule.isPending}>
              {createSchedule.isPending ? "Saving..." : "Add Schedule"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Schedule List ({schedules.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{schedule.title}</p>
                        {schedule.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{schedule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {schedule.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {schedule.targetName}
                      <span className="text-muted-foreground"> ({schedule.targetType})</span>
                    </TableCell>
                    <TableCell className="text-sm">{schedule.scheduleDate}</TableCell>
                    <TableCell>
                      <Badge variant={schedule.status === "Active" ? "default" : "outline"} className="text-[10px]">
                        {schedule.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {schedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No schedules added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
