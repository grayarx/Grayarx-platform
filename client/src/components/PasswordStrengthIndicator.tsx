import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    Object.values(checks).forEach((check) => {
      if (check) score += 20;
    });

    return {
      score,
      checks,
      level: score < 40 ? "weak" : score < 60 ? "fair" : score < 80 ? "good" : "strong",
    };
  }, [password]);

  const colors = {
    weak: "bg-red-500",
    fair: "bg-yellow-500",
    good: "bg-blue-500",
    strong: "bg-green-500",
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Password Strength</label>
          <span className="text-xs font-semibold capitalize">{strength.level}</span>
        </div>
        <Progress value={strength.score} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          {strength.checks.length ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={strength.checks.length ? "text-foreground" : "text-muted-foreground"}>
            At least 8 characters
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {strength.checks.uppercase ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={strength.checks.uppercase ? "text-foreground" : "text-muted-foreground"}>
            One uppercase letter
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {strength.checks.lowercase ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={strength.checks.lowercase ? "text-foreground" : "text-muted-foreground"}>
            One lowercase letter
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {strength.checks.number ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={strength.checks.number ? "text-foreground" : "text-muted-foreground"}>
            One number
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {strength.checks.special ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <X className="h-4 w-4 text-gray-400" />
          )}
          <span className={strength.checks.special ? "text-foreground" : "text-muted-foreground"}>
            One special character (optional)
          </span>
        </div>
      </div>
    </div>
  );
}
