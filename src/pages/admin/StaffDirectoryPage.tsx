import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockStaff } from "@/mockData";
import type { EmploymentStatus } from "@/types";

const employmentStatusVariant: Record<EmploymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  applicant: "secondary",
  active: "default",
  on_leave: "outline",
  exited: "destructive",
};

export default function StaffDirectoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff directory</h1>
        <p className="text-muted-foreground">
          All educators and staff: contact info and employment status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Name, role, contact, and status. Click a name to open the profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/admin/hr/staff/${staff.id}`}
                      className="text-primary hover:underline"
                    >
                      {staff.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{staff.role}</TableCell>
                  <TableCell>
                    <span className="text-sm">{staff.email}</span>
                    {staff.phone && (
                      <span className="text-muted-foreground text-sm block">
                        {staff.phone}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={employmentStatusVariant[staff.employmentStatus]}>
                      {staff.employmentStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
