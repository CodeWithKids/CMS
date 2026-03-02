import { Link } from "react-router-dom";
import { mockStaff } from "@/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

/** Display title for each team member (Code With Kids – team members and roles). */
const TEAM_ROLE_TITLES: Record<string, string> = {
  u1: "Admin — Operations; Founder",
  u11: "Admin — Partnership and Communications",
  u12: "Admin — Marketing and Strategies",
  u13: "Admin — Social Media Marketing (Lead)",
  u3: "Finance — Bookkeeping, invoicing",
  u2: "Educator — Lead educator (Scratch, Python, Robotics)",
  u16: "Learning Development Manager",
};

const ADMIN_IDS = ["u1", "u11", "u12", "u13"];
const FINANCE_IDS = ["u3"];
const EDUCATOR_IDS = ["u2", "u16"];

function getTitle(staffId: string): string {
  return TEAM_ROLE_TITLES[staffId] ?? "";
}

export default function EducatorProfilesListPage() {
  const adminStaff = mockStaff.filter((s) => ADMIN_IDS.includes(s.id));
  const financeStaff = mockStaff.filter((s) => FINANCE_IDS.includes(s.id));
  const educatorStaff = mockStaff.filter((s) => EDUCATOR_IDS.includes(s.id));

  const renderSection = (
    sectionTitle: string,
    members: typeof mockStaff,
    getDetailPath: (id: string) => string
  ) => {
    if (members.length === 0) return null;
    return (
      <Card key={sectionTitle}>
        <CardHeader>
          <CardTitle className="text-lg">{sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role / title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={getDetailPath(m.id)}
                      className="text-primary hover:underline"
                    >
                      {m.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getTitle(m.id) || (m.role === "educator" ? "Educator" : m.role)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title flex items-center gap-2">
        <Users className="w-6 h-6" /> Team profiles
      </h1>
      <p className="page-subtitle text-muted-foreground mb-6">
        Code With Kids – team members and roles
      </p>

      <div className="space-y-6">
        {renderSection(
          "Admin & operations",
          adminStaff,
          (id) => `/admin/hr/staff/${id}`
        )}
        {renderSection(
          "Finance",
          financeStaff,
          (id) => `/admin/hr/staff/${id}`
        )}
        {renderSection(
          "Educators (facilitate sessions)",
          educatorStaff,
          (id) => (id === "u16" ? `/admin/hr/staff/${id}` : `/admin/educator-profiles/${id}`)
        )}
      </div>
    </div>
  );
}
