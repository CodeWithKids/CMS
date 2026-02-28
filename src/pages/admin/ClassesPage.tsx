import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockClasses, getEducatorName, getTerm } from "@/mockData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BookOpen } from "lucide-react";

export default function ClassesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-80 mb-6" />
        <Skeleton className="h-10 w-full max-w-md mb-4" />
        <div className="rounded-lg border overflow-hidden">
          <Skeleton className="h-12 w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Classes</h1>
      <p className="page-subtitle">All active classes and programs</p>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load classes.{" "}
            <Button variant="link" className="p-0 h-auto font-medium" onClick={() => setIsError(false)}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {mockClasses.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No classes yet</p>
          <p className="text-sm mt-1">Add your first class to get started.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Class Name</th>
              <th>Program</th>
              <th>Age Group</th>
              <th>Location</th>
              <th>Educator</th>
              <th>Term</th>
              <th className="w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockClasses.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.program}</td>
                <td>{c.ageGroup}</td>
                <td>{c.location}</td>
                <td>{getEducatorName(c.educatorId)}</td>
                <td>{getTerm(c.termId)?.name ?? c.termId}</td>
                <td>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/admin/classes/${c.id}/enrolments`}>Manage enrolments</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
