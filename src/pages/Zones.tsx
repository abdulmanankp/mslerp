import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useZones, useDistricts, useCoordinators, useCreateZone, useUpdateZoneDistricts, LoadingSkeleton } from "@/hooks/useFirebaseData";
import { MapPin, Building2, Users, ArrowRight, Download, FileText, Plus, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportZoneReportPDF, exportZoneReportExcel } from "@/lib/exportUtils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Zone, ZoneName } from "@/types";

const VALID_ZONE_NAMES: ZoneName[] = [
  "Khyber Pakhtunkhwa",
  "Federal (Islamabad)",
  "North Punjab",
  "Central Punjab",
  "South Punjab",
  "Eastern Punjab",
  "Sindh",
  "Balochistan",
  "Azad Kashmir",
  "Gilgit-Baltistan",
];

export default function Zones() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();

  // Create zone state
  const [createOpen, setCreateOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const createZone = useCreateZone();

  // Edit zone state
  const [editOpen, setEditOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const updateZoneDistricts = useUpdateZoneDistricts();

  if (zL || dL || cL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) {
      toast({ title: "Error", description: "Zone name is required" });
      return;
    }

    const zoneName = newZoneName.trim();
    if (!VALID_ZONE_NAMES.includes(zoneName as ZoneName)) {
      toast({ title: "Error", description: `Zone name must be one of: ${VALID_ZONE_NAMES.join(", ")}` });
      return;
    }

    const alreadyExists = zones.some(z => z.name.toLowerCase() === zoneName.toLowerCase());
    if (alreadyExists) {
      toast({ title: "Error", description: "This zone already exists" });
      return;
    }

    try {
      await createZone.mutateAsync({ name: zoneName as ZoneName, status: "Active" });
      toast({ title: "Success", description: `Zone "${zoneName}" created successfully` });
      setCreateOpen(false);
      setNewZoneName("");
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to create zone" });
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone(zone);
    const zoneDistrictIds = districts.filter(d => d.zone === zone.name).map(d => d.id);
    setSelectedDistrictIds(zoneDistrictIds);
    setEditOpen(true);
  };

  const handleUpdateDistricts = async () => {
    if (!editingZone) return;

    try {
      await updateZoneDistricts.mutateAsync({
        zoneName: editingZone.name,
        districtIds: selectedDistrictIds,
      });
      toast({ title: "Success", description: `Zone districts updated successfully` });
      setEditOpen(false);
      setEditingZone(null);
      setSelectedDistrictIds([]);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update districts" });
    }
  };

  const toggleDistrictSelection = (districtId: string) => {
    setSelectedDistrictIds(prev =>
      prev.includes(districtId)
        ? prev.filter(id => id !== districtId)
        : [...prev, districtId]
    );
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{zones.length} organizational zones across Pakistan</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const zoneDistricts = districts.filter(d => d.zone === zone.name);
            const zoneCoords = coordinators.filter(c => c.zone === zone.name && c.status === "Active");
            const withCoord = zoneDistricts.filter(d => d.currentCoordinatorId).length;
            return (
              <Card key={zone.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate(`/districts?zone=${encodeURIComponent(zone.name)}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); handleEditZone(zone); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); exportZoneReportPDF(zone.name, districts, coordinators, []); }}>
                            <FileText className="h-3.5 w-3.5 mr-2" /> Export PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); exportZoneReportExcel(zone.name, districts, coordinators, []); }}>
                            <FileText className="h-3.5 w-3.5 mr-2" /> Export Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{zone.name}</h3>
                  <Badge variant={zone.status === "Active" ? "default" : "secondary"} className="text-[10px] mb-4">{zone.status}</Badge>
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="font-bold text-sm">{zoneDistricts.length}</p>
                        <p className="text-[10px] text-muted-foreground">Districts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="font-bold text-sm">{zoneCoords.length}</p>
                        <p className="text-[10px] text-muted-foreground">Coords</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-sm">{withCoord}/{zoneDistricts.length}</p>
                      <p className="text-[10px] text-muted-foreground">Assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create Zone Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Zone</DialogTitle>
            <DialogDescription>Add a new organizational zone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                placeholder="e.g., Khyber Pakhtunkhwa"
                value={newZoneName}
                onChange={e => setNewZoneName(e.target.value)}
                list="zone-names"
              />
              <datalist id="zone-names">
                {VALID_ZONE_NAMES.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground mt-1">Valid zone names: {VALID_ZONE_NAMES.join(", ")}</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateZone} disabled={createZone.isPending}>
                {createZone.isPending ? "Creating..." : "Create Zone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Districts Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage {editingZone?.name} Districts</DialogTitle>
            <DialogDescription>Select which districts should be assigned to this zone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {districts.length > 0 ? (
              <ScrollArea className="border rounded-lg p-4 h-96">
                <div className="space-y-2">
                  {districts.map(district => (
                    <div key={district.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded">
                      <Checkbox
                        id={`district-${district.id}`}
                        checked={selectedDistrictIds.includes(district.id)}
                        onCheckedChange={() => toggleDistrictSelection(district.id)}
                      />
                      <label htmlFor={`district-${district.id}`} className="flex-1 cursor-pointer text-sm">
                        {district.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          {district.zone && `(Current: ${district.zone})`}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No districts available</p>
            )}
            <div className="text-sm text-muted-foreground">
              {selectedDistrictIds.length} of {districts.length} districts selected
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateDistricts} disabled={updateZoneDistricts.isPending}>
                {updateZoneDistricts.isPending ? "Updating..." : "Update Districts"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
