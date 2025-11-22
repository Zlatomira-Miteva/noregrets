import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { createMyposCheckout } from "@/lib/mypos";

const itemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

const orderSchema = z.object({
  customer: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(3),
    email: z.string().min(1),
  }),
  deliveryLabel: z.string().min(1),
  items: z.array(itemSchema).min(1),
  totalQuantity: z.number().int().positive(),
  totalAmount: z.number().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = orderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Невалидни данни." },
        { status: 400 }
      );
    }

    const { customer, deliveryLabel, items, totalQuantity, totalAmount } = parsed.data;
    const calculatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(calculatedTotal - totalAmount) > 0.5) {
      return NextResponse.json({ error: "Несъответствие в сумата на поръчката." }, { status: 400 });
    }

    const reference = `NR-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        reference,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        deliveryLabel,
        items,
        totalAmount,
      },
    });

    const checkoutTarget = await createMyposCheckout({
      reference,
      amount: totalAmount,
      description: `Поръчка ${reference}`,
      customer,
      deliveryLabel,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentUrl: checkoutTarget.type === "get" ? checkoutTarget.url : checkoutTarget.endpoint,
      },
    });

    if (checkoutTarget.type === "post") {
      return NextResponse.json({
        form: checkoutTarget,
        orderId: order.id,
      });
    }

    return NextResponse.json({ redirectUrl: checkoutTarget.url, orderId: order.id });
  } catch (error) {
    console.error("Checkout error", error);
    return NextResponse.json({ error: "Неуспешно стартиране на плащането." }, { status: 500 });
  }
}
