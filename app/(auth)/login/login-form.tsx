"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Knot } from "@/components/ui/knot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  username: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});
type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSubmitError(
          data?.error?.message ?? "Those credentials did not match. Try again."
        );
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setSubmitError("We could not reach the bureau. Try again in a moment.");
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      <div
        aria-hidden
        className="absolute left-0 right-0 top-1/2 h-px bg-ink/12 hidden sm:block"
      />

      <div className="relative w-full max-w-[420px] mx-auto flex flex-col items-center">
        <div className="anim-reveal text-vermilion">
          <Knot size={280} animate strokeWidth={2.4} />
        </div>

        <div className="mt-8 anim-reveal anim-delay-2 flex flex-col items-center text-center">
          <h1 className="font-display-tight text-[28px] tracking-[-0.02em] text-ink leading-none">
            <span className="relative inline-block">
              K
              <span
                aria-hidden
                className="absolute -top-1 left-0 size-[6px] rounded-full bg-vermilion"
                style={{ marginLeft: "-3px" }}
              />
            </span>
            notWise
          </h1>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute mt-2"
          >
            The matchmaker&apos;s bureau — est. 2026
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-16 w-full anim-reveal anim-delay-3"
          noValidate
        >
          <div className="flex flex-col gap-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder={
                  process.env.NODE_ENV === "development" ? "try: riya" : undefined
                }
                invalid={!!errors.username}
                {...register("username")}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={!!errors.password}
                {...register("password")}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isSubmitting}
            >
              Enter the bureau
            </Button>
            {submitError && (
              <div
                role="alert"
                aria-live="polite"
                className="text-[13px] leading-5 text-error -mt-2"
              >
                {submitError}
              </div>
            )}
          </div>
        </form>

        <div className="mt-12 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute/70 anim-reveal anim-delay-4">
          Try riya · arjun · ops &nbsp;—&nbsp; password123
        </div>
      </div>
    </main>
  );
}
