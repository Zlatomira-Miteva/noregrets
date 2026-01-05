"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/price";
import FavoriteButton from "@/components/FavoriteButton";

type TiramisuProduct = {
  slug: string;
  name: string;
  price: number;
  priceLabel?: string;
  priceSmall?: number | null;
  priceLarge?: number | null;
  weight?: string | null;
  leadTime?: string;
  description?: string;
  shortDescription?: string;
  weightSmall?: string | null;
  weightLarge?: string | null;
  heroImage: string;
  galleryImages?: string[];
};

type Props = {
  products: TiramisuProduct[];
  initialSlug: string;
};

const flavorButtonClass =
  "rounded-full border border-[#5f000b] px-4 py-2 text-sm font-semibold transition hover:bg-[#5f000b] hover:text-white";

const SIZE_OPTIONS = [
  { id: "single", label: "Малко", weight: "150 г" },
  { id: "double", label: "Голямо", weight: "280 г" },
];

export default function TiramisuDetailClient({ products, initialSlug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const fromQuery = searchParams?.get("size");
    const exists = SIZE_OPTIONS.some((s) => s.id === fromQuery);
    return exists && fromQuery ? fromQuery : SIZE_OPTIONS[0].id;
  });

  const selectedProduct = useMemo(
    () => products.find((p) => p.slug === selectedSlug) ?? products[0],
    [products, selectedSlug]
  );

  const gallery = useMemo(
    () =>
      products.map((product) => ({
        slug: product.slug,
        src: product.heroImage,
        alt: product.name,
      })),
    [products]
  );

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug);
    const basePath =
      pathname.split("/").slice(0, -1).join("/") || "/products/tiramisu";
    const params = new URLSearchParams(searchParams?.toString());
    params.set("size", selectedSize);
    router.replace(`${basePath}/${slug}?${params.toString()}`, {
      scroll: false,
    });
  };

  // Keep size in the URL so it persists across flavor changes/navigations.
  useEffect(() => {
    const currentSize = searchParams?.get("size");
    if (currentSize === selectedSize) return;
    const params = new URLSearchParams(searchParams?.toString());
    params.set("size", selectedSize);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSize]);

  if (!selectedProduct) return null;

  const allergenNote =
    "Всички торти съдържат глутен, млечни продукти и яйца. Някои варианти включват ядки или следи от тях.";
  const descriptionText = selectedProduct.description?.trim();
  const shortText = selectedProduct.shortDescription?.trim();
  const normalizedShort = shortText?.toLowerCase() ?? "";
  const normalizedLong = descriptionText?.toLowerCase() ?? "";
  const hasDistinctDescription =
    normalizedLong && normalizedLong !== normalizedShort;
  const combined = `${shortText ?? ""} ${descriptionText ?? ""}`.toLowerCase();
  const showAllergenNote = !combined.includes(allergenNote.toLowerCase());

  const sizePrices: Record<string, number> = {
    single: selectedProduct.priceSmall ?? selectedProduct.price ?? 0,
    double: selectedProduct.priceLarge ?? selectedProduct.price ?? 0,
  };

  const sizeWeights: Record<string, string | undefined> = {
    single: selectedProduct.weightSmall ?? selectedProduct.weight ?? undefined,
    double: selectedProduct.weightLarge ?? selectedProduct.weight ?? undefined,
  };

  const sizeOptions = SIZE_OPTIONS.map((opt) => ({
    ...opt,
    weight: sizeWeights[opt.id] ?? opt.weight,
  }));

  const activePrice = sizePrices[selectedSize] ?? selectedProduct.price ?? 0;
  const priceLabel = formatPrice(activePrice);

  const increase = () => setQuantity((prev) => prev + 1);
  const decrease = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    const sizeLabel =
      SIZE_OPTIONS.find((s) => s.id === selectedSize)?.label ?? "";
    addItem({
      productId: `tiramisu-${selectedProduct.slug.replace(/^tiramisu-/, "")}`,
      name: selectedProduct.name,
      price: activePrice,
      quantity,
      options: [sizeLabel].filter(Boolean),
      image: selectedProduct.heroImage,
    });
  };

  return (
    <div className="mx-auto w-full px-[clamp(1rem,4vw,4rem)] py-10">
      <div className="grid gap-12 xl:grid-cols-[48%_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1rem] bg-white p-4 shadow-card">
            <div className="relative aspect-square overflow-hidden rounded-[0.75rem]">
              <Image
                src={selectedProduct.heroImage}
                alt={selectedProduct.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 480px, 100vw"
                priority
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {gallery.map((item) => {
              const isActive = item.slug === selectedProduct.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => handleSelect(item.slug)}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition ${
                    isActive
                      ? "border-[#5f000b] ring-2 ring-[#5f000b]"
                      : "border-white/50 hover:border-[#f1b8c4]"
                  }`}
                  aria-label={item.alt}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="150px"
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm uppercase text-[#5f000b]/70">
              {selectedProduct.leadTime}
            </p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                {selectedProduct.name}
              </h1>
              <span className="text-2xl font-semibold sm:pt-1">
                {priceLabel}
              </span>
            </div>
            {shortText ? (
              <p className="text-base text-[#3d1b20]">{shortText}</p>
            ) : null}
            {hasDistinctDescription ? (
              <p className="text-[#3d1b20]">{descriptionText}</p>
            ) : null}
            {showAllergenNote ? (
              <p className="uppercase text-sm text-[#5f000b]/70">
                {allergenNote}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-card">
            <p className="text-sm uppercase text-[#5f000b]/60">Избери размер</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {sizeOptions.map((size) => {
                const isActive = size.id === selectedSize;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id)}
                    className={`${flavorButtonClass} ${
                      isActive
                        ? "bg-[#5f000b] text-white"
                        : "bg-white text-[#5f000b]"
                    }`}
                  >
                    {size.label} {size.weight ? `(${size.weight})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 p-6 shadow-card">
            <p className="text-sm uppercase text-[#5f000b]/60">Избери вкус</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {products.map((product) => {
                const isActive = product.slug === selectedProduct.slug;
                return (
                  <button
                    key={product.slug}
                    type="button"
                    onClick={() => handleSelect(product.slug)}
                    className={`${flavorButtonClass} ${
                      isActive
                        ? "bg-[#5f000b] text-white"
                        : "bg-white text-[#5f000b]"
                    }`}
                  >
                    {product.name}
                  </button>
                );
              })}
            </div>
          </div>

          <section className="space-y-6 rounded-3xl bg-white shadow-card">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Количество</h2>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={decrease}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3bec8] text-lg font-semibold transition hover:bg-[#fff6f8] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Намали количеството"
                disabled={quantity === 1}
              >
                –
              </button>
              <span className="flex h-12 min-w-[3.5rem] items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={increase}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3bec8] bg-white text-lg font-semibold transition hover:bg-[#fff6f8]"
                aria-label="Увеличи количеството"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              className="cta w-full rounded-full bg-[#5f000b] px-6 py-4 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19]"
            >
              Добави {quantity} в количката
            </button>
            <div className="flex">
              <FavoriteButton productId={selectedProduct.slug} />
            </div>
            <div className="space-y-3 rounded-2xl bg-[#fff8fa] p-4 text-sm text-[#5f000b]/80">
              <div>
                <p className="font-semibold text-[#5f000b]">Съхранение</p>
                <p className="mt-1">
                  Съхранявайте тирамису в хладилник до 5 дни.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#5f000b]">Доставка</p>
                <p className="mt-1">
                  Всяко тирамису се доставя с хладилна кутия и е готово за
                  сервиране. Изпращаме от понеделник до четвъртък. Поръчки след
                  15:00 ч. се обработват на следващия работен ден.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#5f000b]">Алергени</p>
                <p className="mt-1">
                  Всички тирамисута съдържат глутен, млечни продукти и яйца. Някои
                  варианти включват ядки или следи от тях.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
