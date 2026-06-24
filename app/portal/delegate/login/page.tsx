"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DelegateLoginPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/family/delegate/auth/magic-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not send link.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-display-m text-ink">Family delegate</h1>
        <p className="mt-2 text-[14px] text-ink-mute">Sign in to view intros for your family member.</p>
        {sent ? (
          <p className="mt-8 text-ink-warm italic">If that email is registered, a sign-in link is on its way.</p>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} className="w-full">
              Email me a link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
