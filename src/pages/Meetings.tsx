import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { meetings, districts } from "@/data/mockData";
import { Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Meetings() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Meetings</h1>
            <p className="text-muted-foreground text-sm mt-1">Central meeting management</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Create Meeting</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map(m => (
            <Card key={m.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/meetings/${m.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{m.scope === "All" ? "All Districts" : m.scope}</Badge>
                </div>
                <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{m.agenda}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Date: {m.meetingDate}</span>
                  <span>{m.districtIds.length} districts</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
