import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { zones, districts, coordinators } from "@/data/mockData";
import { MapPin, Building2, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Zones() {
  const navigate = useNavigate();

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
              <Card
                key={zone.id}
                className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/districts?zone=${encodeURIComponent(zone.name)}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
