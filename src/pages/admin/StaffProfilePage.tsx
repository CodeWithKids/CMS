import { useParams, Link } from "react-router-dom";
import { getStaffMember } from "@/mockData";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Briefcase, FileText, FolderOpen } from "lucide-react";
import type { ContractType, PayType, PreferredPaymentMethod } from "@/types";

const contractLabels: Record<ContractType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contractor: "Contractor",
  volunteer: "Volunteer",
};

const payTypeLabels: Record<PayType, string> = {
  per_session: "Per session",
  salary: "Salary",
  stipend: "Stipend",
};

const paymentMethodLabels: Record<PreferredPaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  eft: "EFT",
  other: "Other",
};

import { formatCurrency } from "@/lib/financeUtils";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>();
  const staff = getStaffMember(id ?? "");

  if (!staff) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Staff member not found.</p>
        <Link to="/admin/hr/staff" className="text-primary hover:underline text-sm">
          ← Back to staff directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Link
        to="/admin/hr/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to staff directory
      </Link>

      {/* Personal & status */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{staff.name}</CardTitle>
                <CardDescription className="capitalize mt-0.5">
                  {staff.role}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">{staff.employmentStatus.replace("_", " ")}</Badge>
                  {staff.contractType && (
                    <Badge variant="outline">{contractLabels[staff.contractType]}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{staff.email}</p>
            </div>
            {staff.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-sm">{staff.phone}</p>
              </div>
            )}
            {staff.hireDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hire date</p>
                <p className="text-sm">{formatDate(staff.hireDate)}</p>
              </div>
            )}
            {staff.createdAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Record created</p>
                <p className="text-sm">{formatDate(staff.createdAt)}</p>
              </div>
            )}
          </div>
          {staff.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{staff.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employment & pay */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Employment details
          </CardTitle>
          <CardDescription>Pay type, rate, and payment method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {staff.payType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pay type</p>
                <p className="text-sm">{payTypeLabels[staff.payType]}</p>
              </div>
            )}
            {staff.baseRate != null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Base rate</p>
                <p className="text-sm">{formatCurrency(staff.baseRate)}</p>
              </div>
            )}
            {staff.preferredPaymentMethod && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preferred payment</p>
                <p className="text-sm">{paymentMethodLabels[staff.preferredPaymentMethod]}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {staff.skills && staff.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {staff.skills.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents / certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" /> Documents & certifications
          </CardTitle>
          <CardDescription>
            Upload and manage documents (upload coming later).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {staff.documents && staff.documents.length > 0 ? (
            <ul className="space-y-2">
              {staff.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
                >
                  <span className="font-medium">{doc.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {doc.type}
                    {doc.uploadedAt && ` · ${formatDate(doc.uploadedAt)}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No documents on file.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
