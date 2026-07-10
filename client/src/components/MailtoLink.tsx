import { cn } from "@/lib/utils";

export default function MailtoLink({
  email,
  subject,
  className,
  children,
}: {
  email: string;
  subject?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const href = subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
  return (
    <a href={href} className={cn("text-primary hover:underline font-medium", className)}>
      {children ?? email}
    </a>
  );
}
