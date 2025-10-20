type OrderEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendOrderEmail({
  to,
  subject,
  html,
  text,
}: OrderEmailPayload): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.info("sendOrderEmail called with:", { to, subject });
  }

  // TODO: wire up Resend or SMTP transport here.
  await Promise.resolve(html ?? text);
}
