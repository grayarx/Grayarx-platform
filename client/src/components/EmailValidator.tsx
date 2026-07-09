import { useEffect, useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

interface EmailValidatorProps {
  email: string;
  onValidChange?: (isValid: boolean) => void;
  className?: string;
}

export function EmailValidator({ email, onValidChange, className = "" }: EmailValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email) {
      setValidationState("idle");
      setMessage("");
      onValidChange?.(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationState("invalid");
      setMessage("Invalid email format");
      onValidChange?.(false);
      return;
    }

    setIsValidating(true);
    setValidationState("idle");

    const timer = setTimeout(() => {
      setValidationState("valid");
      setMessage("Email looks good!");
      onValidChange?.(true);
      setIsValidating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [email, onValidChange]);

  if (!email) return null;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isValidating && <Loader2 className="w-4 h-4 animate-spin text-amber-400" />}
      {!isValidating && validationState === "valid" && (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-500">{message}</span>
        </>
      )}
      {!isValidating && validationState === "invalid" && (
        <>
          <X className="w-4 h-4 text-red-500" />
          <span className="text-red-500">{message}</span>
        </>
      )}
    </div>
  );
}
