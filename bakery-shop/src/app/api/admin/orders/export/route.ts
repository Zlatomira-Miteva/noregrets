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

const normalizeDomain = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").split("/")[0];
  }
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
    const domainName = normalizeDomain(getEnvOrFail("NAP_DOMAIN_NAME"));

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
       WHERE status::text IN ('PAID','REFUNDED') AND "createdAt" BETWEEN $1 AND $2
       ORDER BY "createdAt" ASC`,
      [startDate, endDate],
    );
    const references = ordersRes.rows
      .map((row) => (row.reference ?? row.Reference ?? row.ref ?? "").toString())
      .filter((ref) => ref.length > 0);

    // Map reference -> последна транзакция (от n18 payments)
    const paymentsMap = new Map<string, string>();
    if (references.length) {
      const paymentsRes = await pgPool.query(
        `SELECT o.reference, p.transaction_id
         FROM orders o
         JOIN payments p ON p.order_id = o.id
         WHERE o.reference = ANY($1::text[])
         ORDER BY p.paid_at DESC`,
        [references],
      );
      for (const row of paymentsRes.rows) {
        const ref = row.reference as string;
        if (ref && !paymentsMap.has(ref)) {
          paymentsMap.set(ref, row.transaction_id as string);
        }
      }
    }

    const monOut = mon ? mon.padStart(2, "0") : String(new Date(startDate).getUTCMonth() + 1).padStart(2, "0");
    const godOut = mon ? String(god) : new Date(startDate).getUTCFullYear().toString();

    const vatRate = Number(process.env.NAP_DEFAULT_VAT_RATE ?? 0);
    const paymDefault = process.env.NAP_PAYM_DEFAULT ?? "2"; // 2 - виртуален ПОС
    const posNumber = process.env.NAP_POS_N ?? "";
    const procId = process.env.NAP_PROC_ID ?? "";
    const refundPaymDefault = process.env.NAP_REFUND_PAYM_DEFAULT ?? paymDefault;

    const formatNumber = (value: number | string | null | undefined) => {
      const n = Number(value ?? 0);
      return Number.isFinite(n) ? n.toFixed(2) : "0.00";
    };

    const xmlEscape = (value: unknown) => {
      const str =
        value === null || value === undefined
          ? ""
          : typeof value === "string"
            ? value
            : typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value);
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const formatXml = () => {
      const creationDate = toDateOnly(new Date());
      const xml: string[] = [];
      xml.push('<?xml version="1.0" encoding="windows-1251"?>');
      xml.push("<audit>");
      xml.push(`  <eik>${xmlEscape(eik)}</eik>`);
      xml.push(`  <e_shop_n>${xmlEscape(eShopNumber)}</e_shop_n>`);
      xml.push(`  <domain_name>${xmlEscape(domainName)}</domain_name>`);
      xml.push(`  <creation_date>${xmlEscape(creationDate)}</creation_date>`);
      xml.push(`  <mon>${xmlEscape(monOut)}</mon>`);
      xml.push(`  <god>${xmlEscape(godOut)}</god>`);
      xml.push("  <e_shop_type>1</e_shop_type>");
      xml.push("");

      let refundCount = 0;
      let refundTotal = 0;

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

        if (isRefunded) {
          refundCount += 1;
          refundTotal += refundAmount || 0;
        }

        // Използваме платените редове и (ако има) metadata.subtotal/discount, за да възстановим оригиналната стойност.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadataObj =
          typeof order.metadata === "object" && order.metadata ? (order.metadata as Record<string, unknown>) : undefined;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // Платени редове
        const paidItems: ItemRow[] =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items.map((it: any) => {
            const quantity = Number(it.quantity ?? it.qty ?? 1);
            const priceWithVat = Number(
              Number(it.price ?? it.pricePaid ?? it.unitPrice ?? it.lineTotal ?? 0).toFixed(2),
            );
            return {
              artName: it.name ?? "",
              quantity,
              priceWithVat,
              vatRate,
            };
          }) ?? [];
        const paidGross = paidItems.reduce((acc, it) => acc + it.priceWithVat * it.quantity, 0);

        // Целеви оборот (оригинален): metadata.subtotal, total+discount, или оригиналните цени от редовете.
        const metadataSubtotal =
          typeof metadataObj?.subtotal === "number" ? Number((metadataObj.subtotal as number).toFixed(2)) : null;
        const discountFromMetadata =
          typeof metadataObj?.discountAmount === "number" ? Number((metadataObj.discountAmount as number).toFixed(2)) : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const originalFromItems =
          items.reduce((acc: number, it: any) => {
            const qty = Number(it.quantity ?? it.qty ?? 1);
            const original = it.originalPrice ?? it.originalprice ?? null;
            const priceCandidate =
              original !== null && original !== undefined
                ? Number(original)
                : Number(it.price ?? it.pricePaid ?? it.unitPrice ?? it.lineTotal ?? 0);
            if (Number.isFinite(priceCandidate)) {
              return acc + priceCandidate * qty;
            }
            return acc;
          }, 0) ?? 0;

        const targetGrossCandidateFromDiscount =
          discountFromMetadata !== null && discountFromMetadata !== undefined && discountFromMetadata > 0
            ? Number((totalAmount + discountFromMetadata).toFixed(2))
            : null;

        const targetGross =
          (metadataSubtotal && metadataSubtotal > 0 ? metadataSubtotal : null) ??
          (targetGrossCandidateFromDiscount !== null ? targetGrossCandidateFromDiscount : null) ??
          (originalFromItems > paidGross + 0.01 ? Number(originalFromItems.toFixed(2)) : null) ??
          paidGross;

        let displayItems = paidItems;
        if (paidGross > 0 && targetGross > paidGross + 0.01) {
          const factor = targetGross / paidGross;
          let remaining = targetGross;
          displayItems = paidItems.map((it, idx) => {
            const baseLine = it.priceWithVat * it.quantity;
            const isLast = idx === paidItems.length - 1;
            const lineTotal = isLast ? Number(remaining.toFixed(2)) : Number((baseLine * factor).toFixed(2));
            const unit = it.quantity ? Number((lineTotal / it.quantity).toFixed(2)) : it.priceWithVat;
            remaining = Number((remaining - lineTotal).toFixed(2));
            return { ...it, priceWithVat: unit };
          });
        }

        const originalGross = targetGross;
        const totalNet =
          displayItems.reduce((acc, it) => {
            const net = it.priceWithVat / (1 + it.vatRate / 100);
            return acc + net * it.quantity;
          }, 0) || 0;

        const orderVat = totalAmount - totalNet;
        const transactionId =
          paymentsMap.get(orderRef) ??
          (metadataObj?.paymentTransactionId as string | undefined) ??
          (metadataObj?.transactionId as string | undefined) ??
          (metadataObj && typeof metadataObj.payment === "object"
            ? ((metadataObj.payment as Record<string, unknown>).transactionId as string | undefined)
            : "") ??
          "";
        const computedDiscount = Math.max(0, Number((originalGross - totalAmount).toFixed(2)));
        const discountAmount = computedDiscount;

        xml.push("  <order>");
        xml.push("    <orderenum>");
        xml.push(`      <ord_n>${xmlEscape(orderRef)}</ord_n>`);
        xml.push(`      <ord_d>${xmlEscape(toDateOnly(createdAt))}</ord_d>`);
        xml.push(`      <doc_n>${xmlEscape(docNumber)}</doc_n>`);
        xml.push(`      <doc_date>${xmlEscape(toDateOnly(createdAt))}</doc_date>`);
        xml.push("");
        if (displayItems.length) {
          xml.push("      <art>");
          displayItems.forEach((it) => {
            const net = it.priceWithVat / (1 + it.vatRate / 100);
            const vat = it.priceWithVat - net;
            xml.push("        <artenum>");
            xml.push(`          <art_name>${xmlEscape(it.artName)}</art_name>`);
            xml.push(`          <art_quant>${xmlEscape(it.quantity)}</art_quant>`);
            xml.push(`          <art_price>${formatNumber(it.priceWithVat)}</art_price>`);
            xml.push(`          <art_vat_rate>${xmlEscape(it.vatRate)}</art_vat_rate>`);
            xml.push(`          <art_vat>${formatNumber(vat)}</art_vat>`);
            xml.push(`          <art_sum>${formatNumber(it.priceWithVat * it.quantity)}</art_sum>`);
            xml.push("        </artenum>");
          });
          xml.push("      </art>");
        }

        xml.push(`      <ord_total1>${formatNumber(originalGross)}</ord_total1>`);
        xml.push(`      <ord_disc>${formatNumber(discountAmount)}</ord_disc>`);
        xml.push(`      <ord_vat>${formatNumber(orderVat)}</ord_vat>`);
        xml.push(`      <ord_total2>${formatNumber(totalAmount)}</ord_total2>`);
        xml.push("");
        xml.push(`      <paym>${xmlEscape(paymDefault)}</paym>`);
        xml.push(`      <pos_n>${xmlEscape(posNumber)}</pos_n>`);
        xml.push(`      <trans_n>${xmlEscape(transactionId)}</trans_n>`);
        xml.push(`      <proc_id>${xmlEscape(procId)}</proc_id>`);
        xml.push("    </orderenum>");
        xml.push("  </order>");
        xml.push("");
      }

      xml.push(`  <r_ord>${xmlEscape(refundCount)}</r_ord>`);
      xml.push(`  <r_total>${formatNumber(refundTotal)}</r_total>`);
      xml.push("");
      xml.push("  <rorder>");
      for (const order of ordersRes.rows) {
        if (order.status !== "REFUNDED") continue;
        const orderRef = order.reference ?? order.Reference ?? order.ref ?? "";
        const refundAmount = Number(order.refundAmount ?? order.refundamount ?? 0);
        const refundDate = order.refundAt ?? order.refundat ?? null;
        const refundMethod = order.refundMethod ?? order.refundmethod ?? refundPaymDefault;
        xml.push("    <rorderenum>");
        xml.push(`      <r_ord_n>${xmlEscape(orderRef)}</r_ord_n>`);
        xml.push(`      <r_amount>${formatNumber(refundAmount)}</r_amount>`);
        xml.push(`      <r_date>${xmlEscape(refundDate ? toDateOnly(refundDate) : "")}</r_date>`);
        xml.push(`      <r_paym>${xmlEscape(refundMethod)}</r_paym>`);
        xml.push("    </rorderenum>");
      }
      xml.push("  </rorder>");
      xml.push("</audit>");
      return xml.join("\n");
    };

    // If ?format=xml, return XML audit file
    if (url.searchParams.get("format") === "xml") {
      const xml = formatXml();
      await logAudit({
        entity: "orders",
        action: "orders_export_xml_n18",
        newValue: {
          mon: monOut,
          god: godOut,
          count: ordersRes.rows.length,
          format: "xml",
        },
        operatorCode: session?.user?.operatorCode ?? session?.user?.email ?? null,
      });
      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/xml; charset=windows-1251",
          "Content-Disposition": `attachment; filename="orders-n18-${god}-${mon}.xml"`,
        },
      });
    }

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
      const metadataObj =
        typeof order.metadata === "object" && order.metadata ? (order.metadata as Record<string, unknown>) : undefined;
      const discountFromMetadata =
        typeof metadataObj?.discountAmount === "number" ? (metadataObj.discountAmount as number) : 0;

      // Използваме цената от order.items, като първо търсим pricePaid/lineTotal, а ако не пасва на totalAmount — скалираме.
      let parsedItems: ItemRow[] =
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

      const grossSum = parsedItems.reduce((acc, it) => acc + it.priceWithVat * it.quantity, 0);
      const originalFromItems =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items.reduce((acc: number, it: any) => {
          const qty = Number(it.quantity ?? it.qty ?? 1);
          const original = it.originalPrice ?? it.originalprice ?? null;
          const priceCandidate =
            original !== null && original !== undefined
              ? Number(original)
              : Number(it.price ?? it.pricePaid ?? it.unitPrice ?? it.lineTotal ?? 0);
          if (Number.isFinite(priceCandidate)) {
            return acc + priceCandidate * qty;
          }
          return acc;
        }, 0) ?? 0;

      const targetGrossCandidateFromDiscount =
        Number.isFinite(discountFromMetadata) && discountFromMetadata !== null && discountFromMetadata > 0
          ? Number((totalAmount + discountFromMetadata).toFixed(2))
          : null;

      const targetGross =
        targetGrossCandidateFromDiscount !== null
          ? targetGrossCandidateFromDiscount
          : originalFromItems > grossSum + 0.01
            ? Number(originalFromItems.toFixed(2))
            : grossSum;

      if (grossSum > 0 && targetGross > grossSum + 0.01) {
        const factor = targetGross / grossSum;
        let remaining = targetGross;
        parsedItems = parsedItems.map((it, idx) => {
          const baseLine = it.priceWithVat * it.quantity;
          const isLast = idx === parsedItems.length - 1;
          const lineTotal = isLast ? Number(remaining.toFixed(2)) : Number((baseLine * factor).toFixed(2));
          const unit = it.quantity ? Number((lineTotal / it.quantity).toFixed(2)) : it.priceWithVat;
          remaining = Number((remaining - lineTotal).toFixed(2));
          return { ...it, priceWithVat: unit };
        });
      }

      const totalNet = targetGross; // VAT rate is constant; with 0 VAT totalNet==gross

      const docDate = toDateTime(createdAt);
      const creationDate = toDateOnly(new Date());
      const transactionId =
        paymentsMap.get(orderRef) ??
        (metadataObj?.paymentTransactionId as string | undefined) ??
        (metadataObj?.transactionId as string | undefined) ??
        (metadataObj && typeof metadataObj.payment === "object"
          ? ((metadataObj.payment as Record<string, unknown>).transactionId as string | undefined)
          : "") ??
        "";
      const originalGross = targetGross;
      const computedDiscount = Math.max(0, Number((originalGross - totalAmount).toFixed(2)));
      const discountAmount =
        discountFromMetadata !== null && Number.isFinite(discountFromMetadata)
          ? Number(discountFromMetadata.toFixed(2))
          : computedDiscount;

      if (!parsedItems.length) {
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
          discountAmount.toFixed(2),
          totalAmount.toFixed(2),
          totalAmount.toFixed(2),
          paymDefault,
          "",
          transactionId ?? "",
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

      parsedItems.forEach((it, idx) => {
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
          idx === 0 ? discountAmount.toFixed(2) : "",
          idx === 0 ? totalAmount.toFixed(2) : "",
          idx === 0 ? totalAmount.toFixed(2) : "",
          idx === 0 ? paymDefault : "",
          "",
          transactionId ?? "",
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
