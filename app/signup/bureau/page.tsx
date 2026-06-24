"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BureauSignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/signup/bureau", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgName, slug: slug || undefined, ownerName, username, email, password }),
    });
    setLoading(false);
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error?.message ?? "Signup failed.");
      return;
    }
    toast.success("Bureau created. Sign in with your username.");
    if (d.stripeCheckoutUrl) {
      window.open(d.stripeCheckoutUrl, "_blank");
    }
    router.push("/login?signup=1");
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-display-m text-ink">Start your bureau</h1>
        <p className="mt-2 text-[14px] text-ink-mute">14-day trial · Stripe billing optional · India-ready client premium via Razorpay</p>
        <form onSubmit={submit} className="mt-10 space-y-4">
          <Input placeholder="Bureau name" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          <Input placeholder="URL slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Input placeholder="Your full name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
          <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Button type="submit" className="w-full" loading={loading}>
            Create bureau
          </Button>
        </form>
      </div>
    </div>
  );
}
