import { useAuth } from "@/context/AuthContext";
import { useCoachingInvites } from "@/context/CoachingInvitesContext";
import { getEducatorName } from "@/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck, Mail } from "lucide-react";

function formatDate(d: string): string {
  try {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return d;
  }
}

export default function EducatorCoachingInvitesPage() {
  const { currentUser } = useAuth();
  const educatorId = currentUser?.id ?? "";
  const { getForEducator, getPendingForEducator, accept, decline } = useCoachingInvites();
  const { toast } = useToast();

  const allInvites = getForEducator(educatorId);
  const pendingInvites = getPendingForEducator(educatorId);

  const handleAccept = (id: string) => {
    accept(id);
    toast({ title: "Calendar invite accepted." });
  };

  const handleDecline = (id: string) => {
    decline(id);
    toast({ title: "Invite declined." });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6" /> Coaching invites
        </h1>
        <p className="text-muted-foreground">
          Calendar invites from the Learning & Development Manager. Accept to confirm your coaching or mentoring session.
        </p>
      </div>

      {pendingInvites.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <CalendarCheck className="w-5 h-5" /> Pending invites
            </CardTitle>
            <CardDescription>
              You have {pendingInvites.length} coaching session invite{pendingInvites.length !== 1 ? "s" : ""}. Sessions are not confirmed until you accept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {formatDate(inv.date)} {inv.startTime}–{inv.endTime}
                    </TableCell>
                    <TableCell>{inv.title ?? "Coaching session"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getEducatorName(inv.createdById)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleDecline(inv.id)}>
                        Decline
                      </Button>
                      <Button size="sm" onClick={() => handleAccept(inv.id)}>
                        Accept
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All coaching sessions</CardTitle>
          <CardDescription>
            Accepted and past coaching or mentoring sessions with the L&D team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allInvites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No coaching invites yet. When the L&D Manager schedules a session for you, it will appear here and you can accept the calendar invite.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInvites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {formatDate(inv.date)} {inv.startTime}–{inv.endTime}
                    </TableCell>
                    <TableCell>{inv.title ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {getEducatorName(inv.createdById)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          inv.status === "accepted"
                            ? "text-green-600 dark:text-green-400"
                            : inv.status === "declined"
                              ? "text-muted-foreground"
                              : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
