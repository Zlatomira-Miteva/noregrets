'use server';

import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getGoogleCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetTab = process.env.GOOGLE_SHEET_TAB_NAME ?? "Sheet1";

  const missing = [
    ["GOOGLE_SERVICE_ACCOUNT_EMAIL", clientEmail],
    ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", privateKey],
    ["GOOGLE_SHEET_ID", spreadsheetId],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Google Sheets credentials: ${missing.join(", ")}`);
  }

  return {
    clientEmail: clientEmail as string,
    privateKey: (privateKey as string).replace(/\\n/g, "\n"),
    spreadsheetId: spreadsheetId as string,
    sheetTab,
  };
}

export async function appendNewsletterEmail(email: string) {
  const { clientEmail, privateKey, spreadsheetId, sheetTab } = getGoogleCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const escapedTab = `'${sheetTab.replace(/'/g, "''")}'`;

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${escapedTab}!A:B`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[new Date().toISOString(), email]],
    },
  });
}
