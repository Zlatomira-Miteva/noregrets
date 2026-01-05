import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { logAudit } from "@/lib/audit";
import { isActiveAdmin } from "@/lib/authz";
import { pgPool } from "@/lib/pg";

export const runtime = "nodejs";

const escapeCsv = (value: unknown) => {
  const str =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

  return `"${str.replace(/"/g, '""')}"`;
};

type ItemRow = {
  artName: string;
  quantity: number;
  priceWithVat: number;
  vatRate: number;
};

const toDateOnly = (value: unknown) => {
  const d = value instanceof Date ? value : new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const toDateTime = (value: unknown) => {
  const d = value instanceof Date ? value : new Date(value as string | number | Date);
  if (Number.isNaN(d.getTime())) return "";
  const iso = d.toISOString(); // always UTC to avoid TZ surprises
  // "2024-01-02T15:04:05.000Z" -> "2024-01-02 15:04:05"
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
};

const getEnvOrFail = (key: string) => {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing required env ${key} for N-18 export`);
  }
  return v;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isActiveAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const eik = getEnvOrFail("NAP_EIK");
    const eShopNumber = getEnvOrFail("NAP_E_SHOP_N");
    const eShopType = getEnvOrFail("NAP_E_SHOP_TYPE"); // 1 or 2
    const domainName = getEnvOrFail("NAP_DOMAIN_NAME");

    const url = new URL(request.url);
    // Support both mon/god (preferred) and start/end (YYYY-MM-DD) query params.
    const mon = url.searchParams.get("mon");
    const god = url.searchParams.get("god");
    const startParam = url.searchParams.get("start");
    const endParam = url.searchParams.get("end");

    let startDate: Date;
    let endDate: Date;

    if (mon && god) {
      const monNum = Number(mon);
      const godNum = Number(god);
      if (!Number.isInteger(monNum) || monNum < 1 || monNum > 12) {
        return NextResponse.json({ error: "Invalid mon, expected 01-12" }, { status: 400 });
      }
      if (!Number.isInteger(godNum) || `${god}`.length !== 4) {
        return NextResponse.json({ error: "Invalid god, expected 4-digit year" }, { status: 400 });
      }
      startDate = new Date(Date.UTC(godNum, monNum - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(godNum, monNum, 0, 23, 59, 59, 999));
    } else if (startParam && endParam) {
      startDate = new Date(startParam);
      endDate = new Date(endParam);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Invalid start or end date (expected YYYY-MM-DD)" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Missing mon/god or start/end query params" }, { status: 400 });
    }

    const ordersRes = await pgPool.query(
      `SELECT * FROM "Order"
       WHERE status IN ('PAID','REFUNDED') AND "createdAt" BETWEEN $1 AND $2
       ORDER BY "createdAt" ASC`,
      [startDate, endDate],
    );

    const monOut = mon ? mon.padStart(2, "0") : String(new Date(startDate).getUTCMonth() + 1).padStart(2, "0");
    const godOut = mon ? String(god) : new Date(startDate).getUTCFullYear().toString();

    const header = [
      "EIK",
      "E_SHOP_N",
      "E_SHOP_TYPE",
      "DOMAIN_NAME",
      "CREATION_DATE",
      "MON",
      "GOD",
      "ORD_N",
      "ORD_D",
      "DOC_N",
      "DOC_DATE",
      "ART_NAME",
      "ART_QUANT",
      "ART_PRICE",
      "ART_VAT_RATE",
      "ART_VAT",
      "ART_SUM",
      "ORD_TOTAL1",
      "ORD_DISC",
      "ORD_VAT",
      "ORD_TOTAL2",
      "PAYM",
      "POS_N",
      "TRANS_N",
      "PROC_ID",
      "R_ORD",
      "R_ORD_N",
      "R_AMOUNT",
      "R_DATE",
      "R_PAYM",
      "R_TOTAL",
    ];

    const vatRate = 20; //Number(process.env.NAP_DEFAULT_VAT_RATE ?? 20);
    const paymDefault = 4; // process.env.NAP_PAYM_DEFAULT ?? "4"; // 2 - виртуален ПОС
    const posNumber = process.env.NAP_POS_N ?? "";
    const procId = process.env.NAP_PROC_ID ?? "";
    const refundPaymDefault = process.env.NAP_REFUND_PAYM_DEFAULT ?? paymDefault;

    const rows: Array<string[]> = [];

    for (const order of ordersRes.rows) {
      const orderRef = order.reference ?? order.Reference ?? order.ref ?? "";
      const docNumber = orderRef || order.id || order.orderid || "";
      const createdAt = order.createdAt ?? order.createdat;
      const items = Array.isArray(order.items) ? order.items : [];
      const totalAmount = Number(order.totalAmount ?? order.totalamount ?? 0);
      const isRefunded = order.status === "REFUNDED";
      const refundAmount = Number(order.refundAmount ?? order.refundamount ?? 0);
      const refundDate = order.refundAt ?? order.refundat ?? null;
      const refundMethod = order.refundMethod ?? order.refundmethod ?? refundPaymDefault;

      // Използваме цената от order.items, като първо търсим pricePaid/lineTotal, а ако не пасва на totalAmount — скалираме.
      const parsedItems: ItemRow[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.map((it: any) => {
          const quantity = Number(it.quantity ?? it.qty ?? 1);
          const totalWithVat = Number(it.lineTotal ?? it.total ?? it.totalPrice ?? 0);
          const unitFromTotal = quantity ? totalWithVat / quantity : Number(it.price ?? 0);
          const priceWithVat = Number(it.pricePaid ?? it.unitPrice ?? it.price ?? unitFromTotal ?? 0);
          return {
            artName: it.name ?? "",
            quantity,
            priceWithVat,
            vatRate,
          };
        }) ?? [];

      // Ако сумата на редовете се разминава с платеното, скалирай.
      const grossSum = parsedItems.reduce((acc, it) => acc + it.priceWithVat * it.quantity, 0);
      let adjustedItems = parsedItems;
      if (grossSum > 0 && Math.abs(grossSum - totalAmount) > 0.01) {
        const factor = totalAmount / grossSum;
        let remaining = totalAmount;
        adjustedItems = parsedItems.map((it, idx) => {
          const baseLine = it.priceWithVat * it.quantity;
          const isLast = idx === parsedItems.length - 1;
          const lineTotal = isLast ? Number(remaining.toFixed(2)) : Number((baseLine * factor).toFixed(2));
          const unit = it.quantity ? Number((lineTotal / it.quantity).toFixed(2)) : it.priceWithVat;
          remaining = Number((remaining - lineTotal).toFixed(2));
          return { ...it, priceWithVat: unit };
        });
      }

      const totalNet =
        adjustedItems.reduce((acc, it) => {
          const net = it.priceWithVat / (1 + it.vatRate / 100);
          return acc + net * it.quantity;
        }, 0) || 0;

      const docDate = toDateTime(createdAt);
      const creationDate = toDateOnly(new Date());

      if (!adjustedItems.length) {
        rows.push([
          eik,
          eShopNumber,
          eShopType,
          domainName,
          creationDate,
          monOut,
          godOut,
          orderRef,
          toDateOnly(createdAt),
          docNumber,
          docDate,
          "",
          "0",
          "0.00",
          vatRate.toFixed(0),
          "0.00",
          "0.00",
          totalNet.toFixed(2),
          "0.00",
          totalAmount.toFixed(2),
          totalAmount.toFixed(2),
          paymDefault,
          "",
          "",
          procId,
          isRefunded ? "1" : "0",
          isRefunded ? orderRef : "",
          isRefunded ? refundAmount.toFixed(2) : "0.00",
          isRefunded && refundDate ? toDateOnly(refundDate) : "",
          isRefunded ? refundMethod : "",
          isRefunded ? refundAmount.toFixed(2) : "0.00",
        ]);
        continue;
      }

      adjustedItems.forEach((it, idx) => {
        const net = it.priceWithVat / (1 + it.vatRate / 100);
        const vat = it.priceWithVat - net;
        rows.push([
          eik,
          eShopNumber,
          eShopType,
          domainName,
          creationDate,
          monOut,
          godOut,
          orderRef,
          toDateOnly(createdAt),
          docNumber,
          docDate,
          it.artName,
          it.quantity.toString(),
          it.priceWithVat.toFixed(2),
          it.vatRate.toFixed(0),
          it.priceWithVat.toFixed(2),
          (it.priceWithVat * it.quantity).toFixed(2),
          idx === 0 ? totalNet.toFixed(2) : "",
          idx === 0 ? "0.00" : "",
          idx === 0 ? totalAmount.toFixed(2) : "",
          idx === 0 ? totalAmount.toFixed(2) : "",
          idx === 0 ? paymDefault : "",
          "",
          "",
          idx === 0 ? procId : "",
          idx === 0 && isRefunded ? "1" : "0",
          "",
          "",
          idx === 0 && isRefunded && refundDate ? toDateOnly(refundDate) : "",
          idx === 0 && isRefunded ? refundMethod : "",
          idx === 0 && isRefunded ? refundAmount.toFixed(2) : "0.00",
        ]);
      });
    }

    const csv = [header, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");

    await logAudit({
      entity: "orders",
      action: "orders_export_csv_n18",
      newValue: {
        mon: monOut,
        god: godOut,
        count: rows.length,
      },
      operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="orders-n18-${god}-${mon}.csv"`,
      },
    });
  } catch (error) {
    console.error("[orders.export]", error);
    return NextResponse.json({ error: (error as Error).message ?? "Export failed" }, { status: 500 });
  }
}
