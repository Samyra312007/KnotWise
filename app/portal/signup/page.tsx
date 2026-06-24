"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PortalSignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [gender, setGender] = React.useState<"male" | "female" | "">("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [acceptTos, setAcceptTos] = React.useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = React.useState(false);
  const [marketingOptIn, setMarketingOptIn] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender) {
      toast.error("Select your gender.");
      return;
    }
    if (!acceptTos || !acceptPrivacy) {
      toast.error("Accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/client/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          gender,
          dateOfBirth,
          acceptTos: true,
          acceptPrivacy: true,
          marketingOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not create account.");
        return;
      }
      setSent(true);
    } catch {
      toast.error("Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-display-m text-ink">Join KnotWise</h1>
        <p className="mt-3 text-ink-warm">Create your profile and meet curated matches through your bureau.</p>

        {sent ? (
          <div className="mt-8 space-y-4">
            <p className="text-body-l italic text-ink-warm">
              We sent a verification link to {email}. Open it to continue your profile setup.
            </p>
            <Button variant="quiet" onClick={() => router.push("/portal/login")}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="mt-1 h-11 w-full rounded-[2px] border border-ink/24 bg-paper-quiet px-[14px] text-[14px]"
                required
              >
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-3 text-[13px] text-ink-warm">
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={acceptTos} onChange={(e) => setAcceptTos(e.target.checked)} required />
                <span>
                  I accept the{" "}
                  <Link href="/legal/terms" className="text-vermilion hover:underline" target="_blank">
                    Terms of Service
                  </Link>{" "}
                  and am 18+ with matrimonial intent
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link href="/legal/privacy" className="text-vermilion hover:underline" target="_blank">
                    Privacy Policy
                  </Link>{" "}
                  and processing of my biodata for matchmaking
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                <span>Send me optional product updates and tips (not required)</span>
              </label>
            </div>
            <Button type="submit" variant="accent" loading={loading} className="w-full">
              Create account
            </Button>
            <p className="text-center text-[13px] text-ink-mute">
              Already have an account?{" "}
              <Link href="/portal/login" className="text-vermilion hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
