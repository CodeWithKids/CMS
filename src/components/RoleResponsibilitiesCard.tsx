import { useAuth } from "@/context/AuthContext";
import { getRoleResponsibilities } from "@/data/roleResponsibilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircle } from "lucide-react";

/**
 * Shows the current user's role and responsibilities. Place on each role's dashboard
 * so users see their role and responsibilities as soon as they log in.
 */
export function RoleResponsibilitiesCard() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  const { label, responsibilities } = getRoleResponsibilities(currentUser.role);
  if (responsibilities.length === 0) return null;

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCircle className="w-5 h-5" /> Your role & responsibilities
        </CardTitle>
        <CardDescription>
          You are logged in as <strong>{label}</strong>. Here is what this role covers:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Badge variant="secondary" className="font-medium">
            {label}
          </Badge>
        </div>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {responsibilities.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
