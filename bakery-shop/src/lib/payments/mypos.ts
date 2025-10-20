type CreateSessionInput = {
  orderId: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

type PaymentSession = {
  redirectUrl: string;
  sessionId: string;
};

export async function createMyPosSession(
  input: CreateSessionInput,
): Promise<PaymentSession> {
  // TODO: call myPOS API; placeholder keeps async/await contract intact.
  console.debug("createMyPosSession called with", input);
  return {
    redirectUrl: input.successUrl,
    sessionId: `test-${input.orderId}`,
  };
}

type WebhookPayload = {
  signature: string;
  body: unknown;
};

export async function verifyMyPosWebhook(payload: WebhookPayload): Promise<boolean> {
  // TODO: implement signature verification according to myPOS docs.
  console.debug("verifyMyPosWebhook called with", payload);
  return true;
}
