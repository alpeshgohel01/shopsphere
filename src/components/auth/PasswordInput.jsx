"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getPasswordStrength,
  strengthBarClass,
  strengthLabels,
} from "@/lib/password-strength";
import { cn } from "@/lib/utils";

/**
 * @param {React.ComponentProps<typeof Input> & { showStrength?: boolean }} props
 */
export function PasswordInput({
  showStrength = false,
  className,
  id: idProp,
  value,
  defaultValue,
  onChange,
  ...props
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue != null ? String(defaultValue) : "",
  );
  const password = isControlled ? String(value ?? "") : internalValue;

  function handleChange(event) {
    if (!isControlled) {
      setInternalValue(event.target.value);
    }
    onChange?.(event);
  }
  const strength = showStrength ? getPasswordStrength(password) : null;
  const fillPercent = strength
    ? Math.min(100, (strength.score / 5) * 100)
    : 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={props.autoComplete ?? "current-password"}
          className={cn("pr-10", className)}
          {...(isControlled ? { value } : { defaultValue })}
          onChange={handleChange}
          aria-invalid={props["aria-invalid"]}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-lg text-muted-foreground"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {showStrength && password ? (
        <div className="space-y-1.5" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
                strengthBarClass[strength.label]
              )}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Password strength:{" "}
            <span className="font-medium text-foreground">
              {strengthLabels[strength.label]}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
