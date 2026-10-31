import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   error?: string,
 *   hint?: string,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export function FormField({ id, label, error, hint, children, className }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className="text-[0.8rem] font-medium tracking-wide text-foreground/90"
      >
        {label}
      </Label>
      <div
        className="[&_input]:h-12 [&_input]:rounded-xl [&_input]:bg-card/70 [&_input]:px-3.5 [&_textarea]:rounded-xl"
        aria-describedby={describedBy}
      >
        {children}
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
