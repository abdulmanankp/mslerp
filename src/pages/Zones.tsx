import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { zones, districts, coordinators } from "@/data/mockData";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Zones() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Zones</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage organizational zones across Pakistan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => {
            const zoneDistricts = districts.filter(d => d.zone === zone.name);
            const zoneCoords = coordinators.filter(c => c.zone === zone.name && c.status === "Active");
            return (
              <Card
                key={zone.id}
                className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/districts?zone=${encodeURIComponent(zone.name)}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={zone.status === "Active" ? "default" : "secondary"} className="text-[10px]">
                      {zone.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-base mb-3">{zone.name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Districts</p>
                      <p className="font-semibold">{zoneDistricts.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Coordinators</p>
                      <p className="font-semibold">{zoneCoords.length}</p>
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
