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

export function mentionNotificationEmail(authorName: string, customerName: string, excerpt: string) {
  const subject = `${authorName} mentioned you on ${customerName}`;
  const text = `${authorName} mentioned you in a note on ${customerName}:\n\n${excerpt}`;
  const html = `<p><strong>${authorName}</strong> mentioned you on <strong>${customerName}</strong>:</p><blockquote>${excerpt}</blockquote>`;
  return { subject, text, html };
}
