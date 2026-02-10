import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card>
      <CardContent className="py-12">
        <p className="text-center text-muted-foreground text-sm">
          No leads found. Try adjusting your search criteria.
        </p>
      </CardContent>
    </Card>
  );
}
