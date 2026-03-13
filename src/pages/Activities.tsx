import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActivities, LoadingSkeleton } from "@/hooks/useSupabaseData";
import { Plus } from "lucide-react";

export default function Activities() {
  const { data: activities = [], isLoading } = useActivities();

  if (isLoading) return <AppLayout><LoadingSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Activities</h1>
            <p className="text-muted-foreground text-sm mt-1">Define organizational activities</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Activity</Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">{a.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{a.category}</Badge></TableCell>
                    <TableCell><Badge variant={a.status === "Active" ? "default" : "secondary"} className="text-[10px]">{a.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No activities defined yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
