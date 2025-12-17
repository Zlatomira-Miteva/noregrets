import crypto from "node:crypto";

const ENDPOINT = process.env.MY_POS_ENDPOINT ?? "https://www.mypos.com/vmp/checkout";
const SID = process.env.MY_POS_SID ?? "";
const WALLET = process.env.MY_POS_WALLET_NUMBER ?? "";
const RAW_PRIVATE_KEY = (process.env.MY_POS_PRIVATE_KEY ?? "").trim();
const KEY_INDEX = process.env.MY_POS_KEY_INDEX ?? "1";
const FALLBACK_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://noregrets.bg").replace(/\/+$/, "");

const normalizePem = (pem: string) => pem.replace(/\r/g, "").replace(/\\n/g, "\n").trim();
const two = (n: number) => n.toFixed(2).replace(",", ".");
const envUrl = (value: string | undefined, fallbackPath: string) => {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return `${FALLBACK_BASE_URL}${fallbackPath}`;
};
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
  amount: number;
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

// Ensure cart item totals match the overall amount to avoid gateway validation errors.
const normalizeCart = (
  cart: CheckoutPayload["cart"],
  amount: number,
): CheckoutPayload["cart"] | undefined => {
  if (!cart?.items?.length) return cart;
  const target = Number(amount ?? 0);
  if (!Number.isFinite(target) || target <= 0) return cart;

  const sum = cart.items.reduce((acc, item) => acc + Number(item.price) * Number(item.qty), 0);
  if (sum <= 0) return cart;
  if (Math.abs(sum - target) < 0.01) {
    // Already matches — just round unit prices to 2 decimals.
    return {
      ...cart,
      items: cart.items.map((it) => ({
        ...it,
        price: Number(Number(it.price).toFixed(2)),
      })),
    };
  }

  const factor = target / sum;
  let remaining = Number(target.toFixed(2));

  const adjustedItems = cart.items.map((item, idx) => {
    const baseTotal = Number(item.price) * Number(item.qty);
    const isLast = idx === cart.items.length - 1;
    const provisional = Number((baseTotal * factor).toFixed(2));
    const itemTotal = isLast ? Number(remaining.toFixed(2)) : provisional;
    const unitPrice = item.qty ? Number((itemTotal / Number(item.qty)).toFixed(2)) : 0;
    remaining = Number((remaining - unitPrice * Number(item.qty)).toFixed(2));
    return { ...item, price: unitPrice };
  });

  // If rounding left a delta, fix it on the last item so totals match exactly.
  const totalAfter = adjustedItems.reduce((acc, it) => acc + Number(it.price) * Number(it.qty), 0);
  const delta = Number((target - Number(totalAfter.toFixed(2))).toFixed(2));
  if (Math.abs(delta) >= 0.01 && adjustedItems.length) {
    const last = adjustedItems[adjustedItems.length - 1];
    const qty = Number(last.qty) || 1;
    const correctedPrice = Number(((Number(last.price) + delta / qty)).toFixed(2));
    adjustedItems[adjustedItems.length - 1] = { ...last, price: correctedPrice };
  }

  return { ...cart, items: adjustedItems };
};

export function createMyposCheckout(p: CheckoutPayload) {
  if (!SID) throw new Error("Missing MY_POS_SID");
  if (!WALLET) throw new Error("Missing MY_POS_WALLET_NUMBER");
  if (!RAW_PRIVATE_KEY) throw new Error("Missing MY_POS_PRIVATE_KEY");

  const PRIVATE_KEY = normalizePem(RAW_PRIVATE_KEY);

  // 1) СГЛОБИ ПОЛЕТАТА В ТОЧНИЯ РЕД, В КОЙТО ИСКАШ ДА ГИ ПРАЩАШ
  const entries: Array<[string, string]> = [];

  // Базови
  entries.push(["IPCmethod", "IPCPurchase"]);
  entries.push(["IPCVersion", "1.4"]);
  entries.push(["IPCLanguage", "BG"]); // ако искаш EN, смени и тук
  entries.push(["SID", SID]);
  entries.push(["walletnumber", WALLET]);              // lowercase като в Test Data
  entries.push(["Amount", two(p.amount)]);             // "39.00"
  entries.push(["Currency", "BGN"]);
  entries.push(["OrderID", p.reference]);
  const urlOk = appendReference(envUrl(process.env.MY_POS_SUCCESS_URL, "/api/checkout/success"), p.reference);
  const urlCancel = appendReference(envUrl(process.env.MY_POS_FAILURE_URL, "/api/checkout/failure"), p.reference);
  entries.push(["URL_OK", "https://blue-meadow-9f61.mira-miteva92.workers.dev/mypos/success"]);
  entries.push(["URL_Cancel", "https://blue-meadow-9f61.mira-miteva92.workers.dev/mypos/failure"]);

  // >>> ФИКС: абсолютен HTTPS за Notify
  const notify = appendReference(
    envUrl(process.env.MY_POS_NOTIFY_URL, "/api/payments/mypos/result"),
    p.reference,
  );
  if (!/^https:\/\//i.test(notify)) {
    throw new Error("MY_POS_NOTIFY_URL must be absolute HTTPS (e.g. https://your-domain/api/payments/mypos/result)");
  }
  entries.push(["URL_Notify", "https://blue-meadow-9f61.mira-miteva92.workers.dev/mypos/notify"]);

  entries.push(["CardTokenRequest", "0"]);
  entries.push(["KeyIndex", KEY_INDEX]);
  // CHANGE IT FOR BETTER PAYMENT EXPERIENCE CHANGE TO 3
  entries.push(["PaymentParametersRequired", "3"]);

  // >>> ФИКС: Дръж Note ТАМ, където ще бъде и в POST.
  if (p.description?.trim()) entries.push(["Note", p.description.trim()]);

  // Клиентски (все lowercase, както в Test Data)
  const c = p.customer;
  if (c?.email) entries.push(["customeremail", c.email]);
  if (c?.firstName) entries.push(["customerfirstnames", c.firstName]);
  if (c?.lastName) entries.push(["customerfamilyname", c.lastName]);
  if (c?.phone) entries.push(["customerphone", c.phone]);
  if (c?.country) entries.push(["customercountry", c.country]);
  if (c?.city) entries.push(["customercity", c.city]);
  if (c?.zip) entries.push(["customerzipcode", c.zip]);
  if (c?.address) entries.push(["customeraddress", c.address]);

  // Количка (ако има)
  const cart = normalizeCart(p.cart, p.amount);
  if (cart?.items?.length) {
      entries.push(["CartItems", String(cart.items.length)]);
      cart.items.forEach((it, idx) => {
        const i = idx + 1;
        entries.push([`Article_${i}`, it.name]);
        entries.push([`Quantity_${i}`, String(it.qty)]);
        // >>> ФИКС: 2 десетични за Price_*
        entries.push([`Price_${i}`, two(Number(it.price))]);
        entries.push([`Currency_${i}`, it.currency]);
        entries.push([`Amount_${i}`, two(it.qty * Number(it.price))]);
      });
  }

  // 2) ПОДПИС — САМО СТОЙНОСТИТЕ В СЪЩИЯ ТОЗИ РЕД
  const values = entries.map(([, v]) => v);
  const joined = values.join("-");
  const base64Msg = Buffer.from(joined, "utf8").toString("base64");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(base64Msg);
  signer.end();
  const signature = signer.sign(PRIVATE_KEY, "base64");

  // 3) ВРЪЩАМЕ endpoint + полета (Signature е последен)
  const fields = Object.fromEntries([...entries, ["Signature", signature]]) as Record<string, string>;
  return { endpoint: ENDPOINT, fields, orderedEntries: entries }; // orderedEntries за рендeр
}
