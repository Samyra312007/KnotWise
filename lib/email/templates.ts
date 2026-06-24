export function magicLinkEmail(link: string, firstName: string) {
  const subject = "Your KnotWise portal link";
  const text = `Hello ${firstName},\n\nOpen this link to sign in to your matchmaking portal (expires in 15 minutes):\n${link}\n\n— KnotWise`;
  const html = `<p>Hello ${firstName},</p><p><a href="${link}">Sign in to your portal</a> (expires in 15 minutes).</p><p>— KnotWise</p>`;
  return { subject, text, html };
}

export function handoffNotificationEmail(fromName: string, customerName: string, note: string) {
  const subject = `Handoff request: ${customerName}`;
  const text = `${fromName} wants to hand off ${customerName} to you.\n\nNote: ${note}`;
  const html = `<p><strong>${fromName}</strong> wants to hand off <strong>${customerName}</strong> to you.</p><p>${note}</p>`;
  return { subject, text, html };
}

export function delegateInviteEmail(input: {
  link: string;
  clientFirstName: string;
  role: string;
  subjectPrefix?: string;
}) {
  const roleLabel = input.role === "approver" ? "approver" : "observer";
  const prefix = input.subjectPrefix ?? "Family delegate invitation";
  const subject = `${prefix} — ${input.clientFirstName} on KnotWise`;
  const text = `You have been invited as a family ${roleLabel} for ${input.clientFirstName}.\n\nOpen this link (expires in 15 minutes):\n${input.link}\n\n— KnotWise`;
  const html = `<p>You have been invited as a family <strong>${roleLabel}</strong> for <strong>${input.clientFirstName}</strong>.</p><p><a href="${input.link}">Continue to KnotWise</a> (expires in 15 minutes).</p><p>— KnotWise</p>`;
  return { subject, text, html };
}

export function mentionNotificationEmail(authorName: string, customerName: string, excerpt: string) {
  const subject = `${authorName} mentioned you on ${customerName}`;
  const text = `${authorName} mentioned you in a note on ${customerName}:\n\n${excerpt}`;
  const html = `<p><strong>${authorName}</strong> mentioned you on <strong>${customerName}</strong>:</p><blockquote>${excerpt}</blockquote>`;
  return { subject, text, html };
}

export function scheduleProposalEmail(input: {
  firstName: string;
  proposerName: string;
  whenLabel: string;
  mode: string;
  portalLink: string;
}) {
  const modeLabel = input.mode === "video" ? "video call" : input.mode === "phone" ? "phone call" : "in-person meet";
  const subject = `${input.proposerName} proposed a ${modeLabel}`;
  const text = `Hello ${input.firstName},\n\n${input.proposerName} proposed a ${modeLabel} for ${input.whenLabel}.\n\nReview and respond:\n${input.portalLink}\n\n— KnotWise`;
  const html = `<p>Hello ${input.firstName},</p><p><strong>${input.proposerName}</strong> proposed a ${modeLabel} for <strong>${input.whenLabel}</strong>.</p><p><a href="${input.portalLink}">Review and respond</a></p><p>— KnotWise</p>`;
  return { subject, text, html };
}

export function scheduleAcceptedEmail(input: {
  firstName: string;
  counterpartName: string;
  whenLabel: string;
  mode: string;
  videoLink?: string;
  portalLink: string;
}) {
  const subject = `Date confirmed with ${input.counterpartName}`;
  const videoLine = input.videoLink ? `\n\nJoin video: ${input.videoLink}` : "";
  const text = `Hello ${input.firstName},\n\nYour ${input.mode === "video" ? "video call" : "date"} with ${input.counterpartName} is confirmed for ${input.whenLabel}.${videoLine}\n\nDetails: ${input.portalLink}\n\n— KnotWise`;
  const videoHtml = input.videoLink
    ? `<p><a href="${input.videoLink}">Join video call</a></p>`
    : "";
  const html = `<p>Hello ${input.firstName},</p><p>Your date with <strong>${input.counterpartName}</strong> is confirmed for <strong>${input.whenLabel}</strong>.</p>${videoHtml}<p><a href="${input.portalLink}">View details</a></p><p>— KnotWise</p>`;
  return { subject, text, html };
}

export function scheduleReminderEmail(input: {
  firstName: string;
  title: string;
  whenLabel: string;
  videoLink?: string;
  portalLink: string;
}) {
  const subject = `Reminder: ${input.title} in 1 hour`;
  const videoLine = input.videoLink ? `\n\nJoin video: ${input.videoLink}` : "";
  const text = `Hello ${input.firstName},\n\nReminder: ${input.title} starts at ${input.whenLabel} (about 1 hour from now).${videoLine}\n\n${input.portalLink}\n\n— KnotWise`;
  const videoHtml = input.videoLink
    ? `<p><a href="${input.videoLink}">Join video call</a></p>`
    : "";
  const html = `<p>Hello ${input.firstName},</p><p>Reminder: <strong>${input.title}</strong> starts at <strong>${input.whenLabel}</strong> (about 1 hour from now).</p>${videoHtml}<p><a href="${input.portalLink}">View details</a></p><p>— KnotWise</p>`;
  return { subject, text, html };
}
