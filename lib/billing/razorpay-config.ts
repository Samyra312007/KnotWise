export function isRazorpayDryRun(): boolean {
  return process.env.RAZORPAY_DRY_RUN !== "false";
}

export function isRazorpayConfigured(): boolean {
  if (isRazorpayDryRun()) return true;
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID;
}

export function razorpayPlanId(plan: "plus" | "premium"): string | undefined {
  if (plan === "plus") return process.env.RAZORPAY_PLAN_PLUS;
  return process.env.RAZORPAY_PLAN_PREMIUM;
}
