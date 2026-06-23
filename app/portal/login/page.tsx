"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PortalLoginPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/client/auth/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
    } catch {
      toast.error("Could not send link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-display-m text-ink">Client portal</h1>
        <p className="mt-3 text-ink-warm">Sign in with the email your matchmaker has on file.</p>
        {sent ? (
          <p className="mt-8 text-body-l italic text-ink-warm">
            If that email is registered, a sign-in link is on its way. Check your inbox.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Button type="submit" variant="accent" loading={loading} className="w-full">
              Send magic link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
