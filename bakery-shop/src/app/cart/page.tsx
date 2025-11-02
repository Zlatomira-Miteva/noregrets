"use client";

import Link from "next/link";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";

const CartPage = () => {
  const { items, totalPrice, totalQuantity, clearCart, removeItem } = useCart();

  return (
    <main className="bg-[#f7c8cf] py-16">
      <div className="mx-auto w-full max-w-4xl px-[clamp(1rem,4vw,3rem)]">
        <div className="space-y-4 text-center text-[#2f1b16]">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9d0012]/80">
            Вашата количка
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Сладки покупки</h1>
          <p className="text-sm text-[#8c4a2f]/80">
            {totalQuantity > 0
              ? `В количката има ${totalQuantity} артикула.`
              : "Все още не сте добавили нищо. Изберете любим десерт и го добавете в количката."}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-10 flex justify-center">
            <Link
              href="/"
              className="rounded-full bg-[#2f1b16] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
            >
              Към продуктите
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            <ul className="space-y-5">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-4 rounded-3xl bg-white p-6 text-sm text-[#2f1b16] shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">{item.name}</h2>
                    <p className="text-sm text-[#9d0012]">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                    {item.options && item.options.length > 0 ? (
                      <ul className="space-y-1 text-xs text-[#8c4a2f]/80">
                        {item.options.map((option) => (
                          <li key={`${item.key}-${option}`}>• {option}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-[#9d0012]">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="rounded-full border border-[#f4b9c2] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9d0012] transition hover:bg-[#fde4e8]"
                    >
                      Премахни
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-6 text-[#2f1b16] shadow-card sm:flex-row sm:justify-between">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm uppercase tracking-[0.3em] text-[#9d0012]/70">Общо</p>
                <p className="text-2xl font-semibold text-[#9d0012]">
                  {formatPrice(totalPrice)}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={clearCart}
                  className="rounded-full border border-[#f4b9c2] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9d0012] transition hover:bg-[#fde4e8]"
                >
                  Изчисти количката
                </button>
                <button
                  type="button"
                  className="rounded-full bg-[#2f1b16] px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#561c19]"
                >
                  Поръчай
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default CartPage;

