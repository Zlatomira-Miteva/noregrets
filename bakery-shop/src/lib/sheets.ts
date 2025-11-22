import { google } from "googleapis";

const sheetId = process.env.GOOGLE_SHEET_ID;
const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

const getSheetsClient = async () => {
  if (sheetsClient) return sheetsClient;
  if (!sheetId || !clientEmail || !privateKey) {
    throw new Error("Missing Google Sheets configuration.");
  }
  console.log("[sheets] creating auth", {
    clientEmail,
    keyPresent: Boolean(privateKey),
    keyLength: privateKey?.length ?? 0,
  });

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
};

export async function appendRow(values: Array<string | number>) {
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is not defined.");
  }

  const sheets = await getSheetsClient();
  console.log("[sheets] appending row", values);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [values],
    },
  });
}
