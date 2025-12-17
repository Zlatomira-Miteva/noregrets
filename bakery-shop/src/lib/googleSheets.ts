'use server';

import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getGoogleCredentials() {
  // Support both legacy and current env var names.
  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const sheetTab = process.env.GOOGLE_SHEET_TAB_NAME ?? "Sheet1";

  const missing = [
    ["GOOGLE_SERVICE_ACCOUNT_EMAIL (or GOOGLE_SHEETS_CLIENT_EMAIL)", clientEmail],
    ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or GOOGLE_SHEETS_PRIVATE_KEY)", privateKey],
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

  const tryAppend = async (tabName: string) => {
    const escapedTab = `'${tabName.replace(/'/g, "''")}'`;
    return sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${escapedTab}!A:B`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[new Date().toISOString(), email]],
      },
    });
  };

  try {
    await tryAppend(sheetTab);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // If the configured tab is missing (404), retry with Sheet1 which is the common default.
    const code = error?.code ?? error?.response?.status;
    if (code === 404 && sheetTab !== "Sheet1") {
      await tryAppend("Sheet1");
      return;
    }
    if (code === 404) {
      throw new Error(
        "Google Sheet not found or service account has no access. Verify GOOGLE_SHEET_ID, tab name, and sharing to the service account email.",
      );
    }
    throw error;
  }
}
