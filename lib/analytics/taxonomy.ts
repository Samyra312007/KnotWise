export const ANALYTICS_EVENTS = {
  SIGNUP_STARTED: "client.signup_started",
  SIGNUP_COMPLETED: "client.signup_completed",
  ONBOARDING_STEP: "client.onboarding_step",
  ONBOARDING_COMPLETED: "client.onboarding_completed",
  INTRO_VIEWED: "intro.viewed",
  INTRO_ACCEPTED: "intro.accepted",
  INTRO_DECLINED: "intro.declined",
  MUTUAL_CREATED: "mutual.created",
  C2C_MESSAGE_SENT: "c2c.message_sent",
  DISCOVERY_INTEREST: "discovery.interest",
  VERIFICATION_TIER_UP: "verification.tier_up",
  SUBSCRIPTION_PURCHASED: "subscription.client_purchased",
  SCHEDULE_ACCEPTED: "schedule.accepted",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
