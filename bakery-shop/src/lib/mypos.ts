import crypto from "node:crypto";

const ENDPOINT = process.env.MY_POS_ENDPOINT ?? "https://www.mypos.com/vmp/checkout";
const SID = process.env.MY_POS_SID ?? "";
const WALLET = process.env.MY_POS_WALLET_NUMBER ?? "";
const RAW_PRIVATE_KEY = (process.env.MY_POS_PRIVATE_KEY ?? "").trim();
const KEY_INDEX = process.env.MY_POS_KEY_INDEX ?? "1";
const CURRENCY = (process.env.MY_POS_CURRENCY ?? "EUR").toUpperCase();

const normalizePem = (pem: string) => pem.replace(/\r/g, "").replace(/\\n/g, "\n").trim();

const isAmountString = (s: string) => /^\d+(\.\d{2})$/.test(s);
const assertAmountString = (amount: string) => {
  const a = amount.trim();
  if (!isAmountString(a)) {
    throw new Error(`Invalid amount format "${amount}". Expected string like "1.15" with 2 decimals.`);
  }
  return a;
};

const eurStrToCents = (amountStr: string) => {
  // amountStr already validated "d.dd"
  const [euros, cents] = amountStr.split(".");
  return Number(euros) * 100 + Number(cents);
};

const centsToEurStr = (cents: number) => (cents / 100).toFixed(2);

const appendReference = (urlStr: string, reference: string) => {
  if (!reference) return urlStr;
  try {
    const u = new URL(urlStr);
    u.searchParams.set("reference", reference);
    return u.toString();
  } catch {
    const sep = urlStr.includes("?") ? "&" : "?";
    return `${urlStr}${sep}reference=${encodeURIComponent(reference)}`;
  }
};

export type CheckoutPayload = {
  reference: string;
  amount: string; // IMPORTANT: canonical "0.00" string ONLY
  couponCode?: string; // when present, DO NOT send cart to myPOS
  description?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    country?: string;
    city?: string;
    zip?: string;
    address?: string;
  };
  cart?: { items: Array<{ name: string; qty: number; price: number; currency: string }> };
};

function cartTotalsMatchAmount(cart: CheckoutPayload["cart"], amountStr: string) {
  if (!cart?.items?.length) return true;
  const targetCents = eurStrToCents(amountStr);

  let sumCents = 0;
  for (const it of cart.items) {
    const qty = Number(it.qty);
    const price = Number(it.price);
    if (!Number.isFinite(qty) || qty <= 0) return false;
    if (!Number.isFinite(price) || price < 0) return false;

    const priceCents = Math.round(price * 100);
    sumCents += priceCents * qty;
  }

  return sumCents === targetCents;
}

export function createMyposCheckout(p: CheckoutPayload) {
  if (!SID) throw new Error("Missing MY_POS_SID");
  if (!WALLET) throw new Error("Missing MY_POS_WALLET_NUMBER");
  if (!RAW_PRIVATE_KEY) throw new Error("Missing MY_POS_PRIVATE_KEY");

  const PRIVATE_KEY = normalizePem(RAW_PRIVATE_KEY);
  const amountStr = assertAmountString(p.amount);

  // If coupon is present, force amount-only (no cart).
  // const cart =
  //   p.couponCode || !p.cart?.items?.length || !cartTotalsMatchAmount(p.cart, amountStr)
  //     ? undefined
  //     : p.cart;

  const entries: Array<[string, string]> = [];

  // Base required fields
  entries.push(["IPCmethod", "IPCPurchase"]);
  entries.push(["IPCVersion", "1.4"]);
  entries.push(["IPCLanguage", "BG"]);
  entries.push(["SID", SID]);
  entries.push(["walletnumber", WALLET]);
  entries.push(["Amount", amountStr]);
  entries.push(["Currency", CURRENCY]);
  entries.push(["OrderID", p.reference]);

  const WORKER_BASE = "https://blue-meadow-9f61.mira-miteva92.workers.dev/mypos";
  const urlOk = appendReference(
    process.env.MY_POS_SUCCESS_URL?.trim() || `${WORKER_BASE}/success`,
    p.reference,
  );
  const urlCancel = appendReference(
    process.env.MY_POS_FAILURE_URL?.trim() || `${WORKER_BASE}/failure`,
    p.reference,
  );

  entries.push(["URL_OK", urlOk]);
  entries.push(["URL_Cancel", urlCancel]);

  // Notify must be https (myPOS requirement) :contentReference[oaicite:1]{index=1}
  const notify = appendReference(
    process.env.MY_POS_NOTIFY_URL?.trim() || `${WORKER_BASE}/notify`,
    p.reference,
  );
  if (!/^https:\/\//i.test(notify)) {
    throw new Error(
      'MY_POS_NOTIFY_URL must be absolute HTTPS (e.g. "https://your-domain/api/payments/mypos/notify")',
    );
  }
  entries.push(["URL_Notify", notify]);

  entries.push(["CardTokenRequest", "0"]);
  entries.push(["KeyIndex", KEY_INDEX]);

  // PaymentParametersRequired: 3 only if cart is present, otherwise 1
  entries.push(["PaymentParametersRequired", "1"]); //cart?.items?.length ? "3" : "1"]);

  if (p.description?.trim()) entries.push(["Note", p.description.trim()]);

  // Customer fields (as per myPOS examples)
  const c = p.customer;
  if (c?.email) entries.push(["customeremail", c.email]);
  if (c?.firstName) entries.push(["customerfirstnames", c.firstName]);
  if (c?.lastName) entries.push(["customerfamilyname", c.lastName]);
  if (c?.phone) entries.push(["customerphone", c.phone]);
  if (c?.country) entries.push(["customercountry", c.country]);
  if (c?.city) entries.push(["customercity", c.city]);
  if (c?.zip) entries.push(["customerzipcode", c.zip]);
  if (c?.address) entries.push(["customeraddress", c.address]);

  // Cart (ONLY if it matches Amount exactly)
  // if (cart?.items?.length) {
  //   entries.push(["CartItems", String(cart.items.length)]);

  //   cart.items.forEach((it, idx) => {
  //     const i = idx + 1;
  //     const qty = Number(it.qty);
  //     const priceCents = Math.round(Number(it.price) * 100);
  //     const lineCents = priceCents * qty;

  //     entries.push([`Article_${i}`, it.name]);
  //     entries.push([`Quantity_${i}`, String(qty)]);
  //     entries.push([`Price_${i}`, centsToEurStr(priceCents)]);
  //     entries.push([`Currency_${i}`, CURRENCY]);
  //     entries.push([`Amount_${i}`, centsToEurStr(lineCents)]);
  //   });
  // }

  // Signature: concatenate values with dash, base64 encode, RSA-SHA256 sign, signature base64 :contentReference[oaicite:2]{index=2}
  const values = entries.map(([, v]) => v);
  const joined = values.join("-");
  const base64Msg = Buffer.from(joined, "utf8").toString("base64");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(base64Msg);
  signer.end();
  const signature = signer.sign(PRIVATE_KEY, "base64");

  const fields = Object.fromEntries([...entries, ["Signature", signature]]) as Record<string, string>;
  return { endpoint: ENDPOINT, fields, orderedEntries: entries };
}
