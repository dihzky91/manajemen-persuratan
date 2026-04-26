import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ConflictBadge() {
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Konflik
    </Badge>
  );
}
