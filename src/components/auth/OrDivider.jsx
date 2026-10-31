export function OrDivider() {
  return (
    <div className="relative flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        or continue with email
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
