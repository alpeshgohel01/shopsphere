"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const type = searchParams.get("type");

  const title =
    type === "magic" ? "Magic link sent" : type === "verify" ? "Confirm your email" : "Check your email";

  const description = email
    ? `We sent a message to ${email}. Open it to continue.`
    : "If an account exists for that address, you'll receive a message shortly.";

  return (
    <AuthCard title={title} description={description}>
      <Alert className="rounded-xl border-border/80">
        <Mail className="size-4" />
        <AlertTitle>Inbox</AlertTitle>
        <AlertDescription>
          Open the message from ShopSphere and follow the link to continue. Remember to check
          spam or promotions folders.
        </AlertDescription>
      </Alert>
      {email && type === "verify" ? (
        <Link
          href={`/verify-email?email=${encodeURIComponent(email)}`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "h-10 w-full rounded-xl",
          )}
        >
          Resend or change email
        </Link>
      ) : null}
      <Link
        href="/sign-in"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-full rounded-xl",
        )}
      >
        Back to sign in
      </Link>
    </AuthCard>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}
