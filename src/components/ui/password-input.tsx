import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  /** Hide the reveal button and behave like a normal masked password field. */
  showToggle?: boolean;
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, id, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const uid = React.useId();
    const inputId = id ?? `pwd-${uid}`;

    if (!showToggle) {
      return (
        <Input ref={ref} id={inputId} type="password" className={className} {...props} />
      );
    }

    return (
      <div className={cn("relative", className)}>
        <Input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          className="pr-10"
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
