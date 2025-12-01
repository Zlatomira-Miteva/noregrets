import crypto from "node:crypto";

const ENDPOINT = process.env.MY_POS_ENDPOINT ?? "https://www.mypos.com/vmp/checkout";
const SID = process.env.MY_POS_SID ?? "";
const WALLET = process.env.MY_POS_WALLET_NUMBER ?? "";
const RAW_PRIVATE_KEY = (process.env.MY_POS_PRIVATE_KEY ?? "").trim();
const KEY_INDEX = process.env.MY_POS_KEY_INDEX ?? "1";

const normalizePem = (pem: string) => pem.replace(/\r/g, "").replace(/\\n/g, "\n").trim();
const two = (n: number) => n.toFixed(2).replace(",", ".");

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
  entries.push(["URL_OK", process.env.MY_POS_SUCCESS_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/success`]);
  entries.push(["URL_Cancel", process.env.MY_POS_FAILURE_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/failure`]);

  // >>> ФИКС: абсолютен HTTPS за Notify
  const notify = process.env.MY_POS_NOTIFY_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/mypos/notify`;
  if (!/^https:\/\//i.test(notify)) {
    throw new Error("MY_POS_NOTIFY_URL must be absolute HTTPS (e.g. https://your-domain/api/mypos/notify)");
  }
  entries.push(["URL_Notify", notify]);

  entries.push(["CardTokenRequest", "0"]);
  entries.push(["KeyIndex", KEY_INDEX]);
  entries.push(["PaymentParametersRequired", "1"]);

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
  if (p.cart?.items?.length) {
    entries.push(["CartItems", String(p.cart.items.length)]);
    p.cart.items.forEach((it, idx) => {
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
