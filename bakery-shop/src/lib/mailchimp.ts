const {
  MAILCHIMP_API_KEY,
  MAILCHIMP_LIST_ID,
  MAILCHIMP_SERVER_PREFIX,
} = process.env;

type MailchimpPayload = {
  email: string;
  firstName?: string;
  lastName?: string;
};

export async function addToMailchimp({ email, firstName, lastName }: MailchimpPayload): Promise<void> {
  const derivedPrefix =
    MAILCHIMP_SERVER_PREFIX ||
    (MAILCHIMP_API_KEY && MAILCHIMP_API_KEY.includes("-") ? MAILCHIMP_API_KEY.split("-").pop() : undefined);

  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !derivedPrefix) {
    throw new Error("Missing Mailchimp configuration");
  }

  const authToken =
    typeof Buffer !== "undefined"
      ? Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")
      : btoa(`anystring:${MAILCHIMP_API_KEY}`);

  const response = await fetch(
    `https://${derivedPrefix}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName ?? "",
          LNAME: lastName ?? "",
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok && payload.title !== "Member Exists") {
    const detail = payload?.detail ?? "Mailchimp request failed";
    throw new Error(detail);
  }
}
