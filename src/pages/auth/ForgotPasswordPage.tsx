import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl border p-6 shadow-lg text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Forgot password?</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Contact your administrator to reset your password. If you're a team member, ask your admin; if you're a parent or organisation contact, reach out to Code With Kids support.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full gap-2">
            <Link to="/login">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
