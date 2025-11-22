import crypto from "node:crypto";

const MY_POS_ENDPOINT = process.env.MY_POS_ENDPOINT ?? "https://www.mypos.eu/vmp/checkout/payment";
const MY_POS_CLIENT_ID = process.env.MY_POS_CLIENT_ID;
const MY_POS_CLIENT_CODE = process.env.MY_POS_CLIENT_CODE;
const MY_POS_SECRET = process.env.MY_POS_SECRET;
const SUCCESS_URL = process.env.MY_POS_SUCCESS_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/success`;
const FAILURE_URL = process.env.MY_POS_FAILURE_URL ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/checkout/failure`;
const NOTIFY_URL = process.env.MY_POS_NOTIFY_URL ?? SUCCESS_URL;

const IPC_SID = process.env.MY_POS_SID;
const IPC_WALLET = process.env.MY_POS_WALLET_NUMBER;
const IPC_PRIVATE_KEY = process.env.MY_POS_PRIVATE_KEY;
const IPC_KEY_INDEX = process.env.MY_POS_KEY_INDEX ?? "1";
const IPC_METHOD = process.env.MY_POS_METHOD ?? "IPCPurchase";
const IPC_VERSION = process.env.MY_POS_VERSION ?? "1.4";
const IPC_LANGUAGE = process.env.MY_POS_LANGUAGE ?? "BG";

type CheckoutPayload = {
  reference: string;
  amount: number;
  description: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  deliveryLabel?: string;
};

const buildSignature = (payload: CheckoutPayload) => {
  if (!MY_POS_CLIENT_ID || !MY_POS_CLIENT_CODE || !MY_POS_SECRET) {
    return null;
  }

  const parts = [
    MY_POS_CLIENT_ID,
    MY_POS_CLIENT_CODE,
    payload.reference,
    payload.amount.toFixed(2),
    "BGN",
    SUCCESS_URL,
    FAILURE_URL,
    payload.description,
    MY_POS_SECRET,
  ];

  return crypto.createHash("sha1").update(parts.join("")).digest("hex");
};

type CheckoutRedirect =
  | { type: "get"; url: string }
  | { type: "post"; endpoint: string; fields: Record<string, string> };

const normalizeKey = (value?: string | null) => value?.replace(/\\n/g, "\n").trim();

const createIpcCheckout = (payload: CheckoutPayload): CheckoutRedirect => {
  if (!IPC_SID || !IPC_WALLET || !IPC_PRIVATE_KEY) {
    throw new Error("Missing myPOS IPC credentials.");
  }

  const fields: Record<string, string> = {
    IPCmethod: IPC_METHOD,
    IPCVersion: IPC_VERSION,
    IPCLanguage: IPC_LANGUAGE,
    SID: IPC_SID,
    walletnumber: IPC_WALLET,
    Amount: payload.amount.toFixed(2),
    Currency: "BGN",
    OrderID: payload.reference,
    URL_OK: SUCCESS_URL,
    URL_Cancel: FAILURE_URL,
    URL_Notify: NOTIFY_URL,
    CardTokenRequest: "0",
    KeyIndex: IPC_KEY_INDEX,
    PaymentParametersRequired: "1",
    Note: payload.description,
  };

  if (payload.customer) {
    fields.customeremail = payload.customer.email;
    fields.customerfirstnames = payload.customer.firstName;
    fields.customerfamilyname = payload.customer.lastName;
    fields.customerphone = payload.customer.phone;
  }

  const fieldOrder = [
    "IPCmethod",
    "IPCVersion",
    "IPCLanguage",
    "SID",
    "walletnumber",
    "Amount",
    "Currency",
    "OrderID",
    "URL_OK",
    "URL_Cancel",
    "URL_Notify",
    "CardTokenRequest",
    "KeyIndex",
    "PaymentParametersRequired",
    "customeremail",
    "customerfirstnames",
    "customerfamilyname",
    "customerphone",
    "customercountry",
    "customercity",
    "customerzipcode",
    "customeraddress",
    "Note",
    "CartItems",
    "Article_1",
    "Quantity_1",
    "Price_1",
    "Currency_1",
    "Amount_1",
    "Article_2",
    "Quantity_2",
    "Price_2",
    "Currency_2",
    "Amount_2",
  ];

  const signaturePayload = fieldOrder
    .map((key) => fields[key] ?? "")
    .join("");

  const signer = crypto.createSign("RSA-SHA1");
  signer.update(signaturePayload);
  const normalizedKey = normalizeKey(IPC_PRIVATE_KEY);
  if (!normalizedKey) {
    throw new Error("Missing myPOS IPC private key.");
  }

  const signature = signer.sign(normalizedKey, "base64");
  fields.Signature = signature;

  return {
    type: "post",
    endpoint: MY_POS_ENDPOINT,
    fields,
  };
};

export const createMyposCheckout = async (payload: CheckoutPayload): Promise<CheckoutRedirect> => {
  if (IPC_SID && IPC_WALLET && IPC_PRIVATE_KEY) {
    return createIpcCheckout(payload);
  }

  const signature = buildSignature(payload);
  if (!signature) {
    throw new Error("Missing myPOS credentials.");
  }

  const params = new URLSearchParams({
    clientId: MY_POS_CLIENT_ID!,
    clientCode: MY_POS_CLIENT_CODE!,
    orderReference: payload.reference,
    amount: payload.amount.toFixed(2),
    currency: "BGN",
    successUrl: SUCCESS_URL,
    failureUrl: FAILURE_URL,
    description: payload.description,
    signature,
  });

  return { type: "get", url: `${MY_POS_ENDPOINT}?${params.toString()}` };
};
