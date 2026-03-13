import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useZones, useDistricts, useCoordinators, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { MapPin, Building2, Users, ArrowRight, Download, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { exportZoneReportPDF, exportZoneReportExcel } from "@/lib/exportUtils";

export default function Zones() {
  const navigate = useNavigate();
  const { data: zones = [], isLoading: zL } = useZones();
  const { data: districts = [], isLoading: dL } = useDistricts();
  const { data: coordinators = [], isLoading: cL } = useCoordinators();

  if (zL || dL || cL) return <AppLayout><LoadingSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zones</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{zones.length} organizational zones across Pakistan</p>
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
    </AppLayout>
  );
}
