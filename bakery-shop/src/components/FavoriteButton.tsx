"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeVariantKey, type FavoritePayload } from "@/lib/favorites";

type Props = {
  productId: string;
  payload?: FavoritePayload;
  className?: string;
  disabled?: boolean;
};

export default function FavoriteButton({ productId, payload, className, disabled }: Props) {
  const router = useRouter();
  const [isFav, setIsFav] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const variantKey = useMemo(() => computeVariantKey(payload ?? null), [payload]);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch("/api/account/favorites");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setIsFav(
          Boolean(
            (data.favorites ?? []).find(
              (f: { productId: string; variantKey?: string }) =>
                f.productId === productId && (variantKey ? f.variantKey === variantKey : true),
            ),
          ),
        );
      } catch {
        /* ignore */
      }
    };
    check();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const toggle = async () => {
    if (disabled) return;
    setLoading(true);
    try {
      const method = isFav ? "DELETE" : "POST";
      const res = await fetch("/api/account/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, payload, variantKey }),
      });
      if (res.status === 401) {
        router.push(`/account/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) {
        console.error("favorite toggle failed");
      } else {
        setIsFav(!isFav);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || disabled}
      className={`inline-flex items-center gap-2 rounded-full border border-[#f3bec8] px-4 py-2 text-sm font-semibold transition hover:bg-[#fff6f8] ${className ?? ""}`}
      aria-disabled={disabled || loading}
    >
      <span aria-hidden="true">{isFav ? "♥" : "♡"}</span> {isFav ? "В любими" : "Добави в любими"}
    </button>
  );
}
