"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { formatPrice } from "@/utils/price";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  heroImage?: string | null;
};

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  categoryName: string;
  categoryId: string;
  shortDescription?: string | null;
  description?: string | null;
  variantName?: string | null;
  weight?: string | null;
  leadTime?: string | null;
  heroImage?: string | null;
  galleryImages?: string[];
  categoryImages?: string[];
};

const defaultCategoryForm = {
  name: "",
  slug: "",
  description: "",
  heroImage: "",
};

const defaultProductForm = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  heroImage: "",
  galleryImages: "",
  categoryImages: "",
  categoryId: "",
  status: "PUBLISHED",
  variantName: "",
  weight: "",
  leadTime: "",
};

const normalizeImageSrc = (value: string) => {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value.replace(/^\/+/, "")}`;
};

const parseMultilineInput = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const formatArrayInput = (list?: string[] | null) => (list && list.length ? list.join("\n") : "");

export default function AdminProductsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const isEditing = Boolean(editingProductId);

  const resetProductForm = (preserveCategory = true) => {
    setProductForm((prev) => ({
      ...defaultProductForm,
      categoryId: preserveCategory ? prev.categoryId || categories[0]?.id || "" : categories[0]?.id || "",
    }));
    setEditingProductId(null);
    setImageUploadError(null);
  };

  const loadCategories = useCallback(() => {
    setCategoryError(null);
    fetch("/api/admin/categories")
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Неупълномощен достъп.");
        }
        return res.json();
      })
      .then((data) => {
        const list = data.categories ?? [];
        setCategories(list);
        setProductForm((prev) => {
          if (prev.categoryId || !list.length) {
            return prev;
          }
          return { ...prev, categoryId: list[0].id };
        });
      })
      .catch((err) => setCategoryError(err.message || "Неуспешно зареждане на категориите."));
  }, []);

  const loadProducts = useCallback(() => {
    setProductError(null);
    fetch("/api/admin/products")
      .then((res) => {
        if (res.status === 401) {
          throw new Error("Неупълномощен достъп.");
        }
        return res.json();
      })
      .then((data) => setProducts(data.products ?? []))
      .catch((err) => setProductError(err.message || "Неуспешно зареждане на продуктите."));
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ffefed] text-[#5f000b]">
        <p>Зареждаме...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault();
    setCategoryLoading(true);
    setCategoryMessage(null);
    setCategoryError(null);

    fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryForm.name.trim(),
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || undefined,
        heroImage: categoryForm.heroImage || undefined,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Неуспешно създаване на категория.");
        }
        setCategoryMessage("Категорията е създадена успешно.");
        setCategoryForm(defaultCategoryForm);
        loadCategories();
      })
      .catch((err: Error) => setCategoryError(err.message))
      .finally(() => setCategoryLoading(false));
  };

  const handleProductSubmit = (event: FormEvent) => {
    event.preventDefault();
    setProductLoading(true);
    setProductMessage(null);
    setProductError(null);

    const priceValue = Number(productForm.price);
    if (Number.isNaN(priceValue)) {
      setProductError("Моля, въведете валидна цена.");
      setProductLoading(false);
      return;
    }

    if (!productForm.categoryId) {
      setProductError("Изберете категория за продукта.");
      setProductLoading(false);
      return;
    }

    const galleryImages = parseMultilineInput(productForm.galleryImages);
    if (!galleryImages.length) {
      setProductError("Добавете поне едно изображение в галерията.");
      setProductLoading(false);
      return;
    }

    const categoryImages = parseMultilineInput(productForm.categoryImages);

    const isUpdate = Boolean(editingProductId);
    const endpoint = isUpdate ? `/api/admin/products/${editingProductId}` : "/api/admin/products";
    const method = isUpdate ? "PATCH" : "POST";

    fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productForm.name.trim(),
        slug: productForm.slug || undefined,
        shortDescription: productForm.shortDescription || undefined,
        description: productForm.description || undefined,
        weight: productForm.weight,
        leadTime: productForm.leadTime,
        heroImage: productForm.heroImage,
        galleryImages,
        categoryImages: categoryImages.length ? categoryImages : undefined,
        price: priceValue,
        categoryId: productForm.categoryId,
        status: productForm.status,
        variantName: productForm.variantName || undefined,
      }),
    })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Неуспешно запазване на продукт.");
        }
        setProductMessage(isUpdate ? "Продуктът е обновен успешно." : "Продуктът е създаден успешно.");
        resetProductForm();
        loadProducts();
      })
      .catch((err: Error) => setProductError(err.message))
      .finally(() => setProductLoading(false));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.urls?.length) {
        throw new Error(payload?.error ?? "Неуспешно качване.");
      }

      setProductForm((prev) => ({ ...prev, heroImage: payload.urls[0] }));
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Неуспешно качване.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>, target: "galleryImages" | "categoryImages") => {
    const files = event.target.files;
    if (!files?.length) return;

    setImageUploadError(null);
    setImageUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok || !payload?.urls?.length) {
        throw new Error(payload?.error ?? "Неуспешно качване.");
      }

      setProductForm((prev) => {
        const existing = prev[target];
        const appended = existing ? `${existing}\n${payload.urls.join("\n")}` : payload.urls.join("\n");
        return { ...prev, [target]: appended.trim() };
      });
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Неуспешно качване.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const handleEditProduct = (product: ProductSummary) => {
    setEditingProductId(product.id);
    setProductMessage(null);
    setProductError(null);
    setImageUploadError(null);
    setProductForm({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
      weight: product.weight ?? "",
      leadTime: product.leadTime ?? "",
      price: product.price.toString(),
      categoryId: product.categoryId,
      status: product.status,
      variantName: product.variantName ?? "",
      heroImage: product.heroImage ?? product.galleryImages?.[0] ?? "",
      galleryImages: formatArrayInput(product.galleryImages),
      categoryImages: formatArrayInput(product.categoryImages),
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (!window.confirm("Наистина ли искате да изтриете този продукт?")) {
      return;
    }
    setDeletingProductId(productId);
    setProductMessage(null);
    setProductError(null);
    fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload.error ?? "Неуспешно изтриване.");
        }
        if (editingProductId === productId) {
          resetProductForm();
        }
        setProductMessage("Продуктът беше изтрит.");
        loadProducts();
      })
      .catch((err: Error) => setProductError(err.message))
      .finally(() => setDeletingProductId(null));
  };

  return (
    <div className="min-h-screen bg-[#ffefed] px-[clamp(1rem,4vw,4rem)] py-16 text-[#5f000b]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase">Админ панел</p>
          <h1 className="text-4xl font-semibold">Категории и продукти</h1>
          <p>Добавяйте нови категории, продукти и варианти директно от това табло.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin/orders"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Поръчки
            </Link>
            <Link
              href="/admin/coupons"
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Промо кодове
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-[#5f000b] px-4 py-2 text-xs font-semibold uppercase hover:bg-white/40"
            >
              Изход
            </button>
          </div>
        </header>

        <section className="space-y-8 rounded-3xl bg-white/90 p-6 shadow-card">
          <div>
            <h2 className="text-2xl font-semibold">Добави категория</h2>
            <p className="text-sm text-[#5f000b]/80">Новите категории се появяват веднага след запазване.</p>
          </div>
          <form onSubmit={handleCategorySubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm uppercase">
              Име
              <input
                type="text"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>
            <label className="text-sm uppercase">
              Slug
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, slug: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="Автоматично, ако е празно"
              />
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Описание
              <textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                rows={3}
              />
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Hero изображение
              <input
                type="text"
                value={categoryForm.heroImage}
                onChange={(event) => setCategoryForm((prev) => ({ ...prev, heroImage: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="cookies-hero.jpg"
              />
            </label>
            <button
              type="submit"
              disabled={categoryLoading}
              className="sm:col-span-2 rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19] disabled:opacity-60"
            >
              {categoryLoading ? "Създаваме..." : "Добави категория"}
            </button>
          </form>
          {categoryMessage ? <p className="text-sm text-green-700">{categoryMessage}</p> : null}
          {categoryError ? <p className="text-sm text-[#b42318]">{categoryError}</p> : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-[#5f000b]/70">
                  <th className="pb-2">Име</th>
                  <th className="pb-2">Slug</th>
                  <th className="pb-2">Описание</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-sm text-[#5f000b]/70">
                      Все още няма категории.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-t border-[#f5d5d6]">
                      <td className="py-2 font-semibold">{category.name}</td>
                      <td className="py-2">{category.slug}</td>
                      <td className="py-2 text-sm text-[#5f000b]/70">{category.description || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl bg-white/90 p-6 shadow-card">
          <div>
            <h2 className="text-2xl font-semibold">Добави продукт</h2>
            <p className="text-sm text-[#5f000b]/80">Използвайте същите изображения и описания, които ще виждат клиентите.</p>
            {isEditing ? (
              <p className="mt-2 rounded-2xl bg-[#5f000b]/10 px-4 py-2 text-sm font-semibold text-[#5f000b]">
                Редактирате: {productForm.name || "избран продукт"}
              </p>
            ) : null}
          </div>
          <form onSubmit={handleProductSubmit} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm uppercase">
              Име
              <input
                type="text"
                value={productForm.name}
                onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>
            <label className="text-sm uppercase">
              Slug
              <input
                type="text"
                value={productForm.slug}
                onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="Автоматично, ако е празно"
              />
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Кратко описание
              <textarea
                value={productForm.shortDescription}
                onChange={(event) => setProductForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                rows={2}
              />
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Описание
              <textarea
                value={productForm.description}
                onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                rows={3}
              />
            </label>
            <label className="text-sm uppercase">
              Тегло / количество
              <input
                type="text"
                value={productForm.weight}
                onChange={(event) => setProductForm((prev) => ({ ...prev, weight: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="напр. 220 гр."
                required
              />
            </label>
            <label className="text-sm uppercase">
              Срок за доставка
              <input
                type="text"
                value={productForm.leadTime}
                onChange={(event) => setProductForm((prev) => ({ ...prev, leadTime: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="напр. Доставка до 3 работни дни"
                required
              />
            </label>
            <label className="text-sm uppercase">
              Цена
              <input
                type="number"
                min={0}
                step={0.01}
                value={productForm.price}
                onChange={(event) => setProductForm((prev) => ({ ...prev, price: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                required
              />
            </label>
            <label className="text-sm uppercase">
              Категория
              <select
                value={productForm.categoryId}
                onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                disabled={!categories.length}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Галерия (по едно изображение на ред)
              <textarea
                value={productForm.galleryImages}
                onChange={(event) => setProductForm((prev) => ({ ...prev, galleryImages: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                rows={4}
                required
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleGalleryUpload(event, "galleryImages")}
                disabled={imageUploading}
                className="mt-2 rounded-2xl border border-dashed border-[#dcb1b1] bg-white px-4 py-2 text-xs focus:border-[#5f000b] focus:outline-none disabled:opacity-60"
              />
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Изображения за категория (по избор, по едно на ред)
              <textarea
                value={productForm.categoryImages}
                onChange={(event) => setProductForm((prev) => ({ ...prev, categoryImages: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                rows={3}
              />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleGalleryUpload(event, "categoryImages")}
                disabled={imageUploading}
                className="mt-2 rounded-2xl border border-dashed border-[#dcb1b1] bg-white px-4 py-2 text-xs focus:border-[#5f000b] focus:outline-none disabled:opacity-60"
              />
            </label>
            <label className="text-sm uppercase">
              Hero изображение
              <input
                type="text"
                value={productForm.heroImage}
                onChange={(event) => setProductForm((prev) => ({ ...prev, heroImage: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder="hero-image.png"
                required
              />
            </label>
            <div className="flex flex-col gap-3 text-sm uppercase sm:col-span-2">
              <span>Качи изображение</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageUploading}
                className="rounded-2xl border border-dashed border-[#dcb1b1] bg-white px-4 py-3 text-xs focus:border-[#5f000b] focus:outline-none disabled:opacity-60"
              />
              {imageUploading ? <p className="text-xs normal-case text-[#5f000b]/80">Качваме изображението...</p> : null}
              {imageUploadError ? <p className="text-xs normal-case text-[#b42318]">{imageUploadError}</p> : null}
              {productForm.heroImage ? (
                <div className="text-xs normal-case text-[#5f000b]/70">
                  <p>Текущ файл: {productForm.heroImage}</p>
                  <div className="mt-2 h-32 w-32 overflow-hidden rounded-2xl border border-[#f5d5d6]">
                    <Image
                      src={normalizeImageSrc(productForm.heroImage)}
                      alt={productForm.name || "Продукт"}
                      width={128}
                      height={128}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <label className="text-sm uppercase">
              Статус
              <select
                value={productForm.status}
                onChange={(event) => setProductForm((prev) => ({ ...prev, status: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
              >
                <option value="PUBLISHED">Активен</option>
                <option value="DRAFT">Чернова</option>
                <option value="ARCHIVED">Архивиран</option>
              </select>
            </label>
            <label className="text-sm uppercase sm:col-span-2">
              Име на варианта
              <input
                type="text"
                value={productForm.variantName}
                onChange={(event) => setProductForm((prev) => ({ ...prev, variantName: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-[#dcb1b1] bg-white px-4 py-3 text-sm focus:border-[#5f000b] focus:outline-none"
                placeholder='По избор (напр. "Кутия от 6 кукита")'
              />
            </label>
            <button
              type="submit"
              disabled={productLoading || !categories.length}
              className="sm:col-span-2 rounded-full bg-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-white transition hover:bg-[#561c19] disabled:opacity-60"
            >
              {!categories.length
                ? "Добавете категория, за да продължите"
                : productLoading
                  ? isEditing
                    ? "Запазваме..."
                    : "Създаваме..."
                  : isEditing
                    ? "Запази промените"
                    : "Добави продукт"}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={() => resetProductForm()}
                className="sm:col-span-2 rounded-full border border-[#5f000b] px-6 py-3 text-sm font-semibold uppercase text-[#5f000b] transition hover:bg-white/60"
              >
                Откажи редакция
              </button>
            ) : null}
          </form>
          {productMessage ? <p className="text-sm text-green-700">{productMessage}</p> : null}
          {productError ? <p className="text-sm text-[#b42318]">{productError}</p> : null}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-[#5f000b]/70">
                  <th className="pb-2">Име</th>
                  <th className="pb-2">Категория</th>
                  <th className="pb-2">Цена</th>
                  <th className="pb-2">Тегло</th>
                  <th className="pb-2">Доставка</th>
                  <th className="pb-2">Статус</th>
                  <th className="pb-2">Slug</th>
                  <th className="pb-2 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-sm text-[#5f000b]/70">
                      Все още няма добавени продукти.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-t border-[#f5d5d6]">
                      <td className="py-2 font-semibold">{product.name}</td>
                      <td className="py-2">{product.categoryName}</td>
                      <td className="py-2">{formatPrice(product.price)}</td>
                      <td className="py-2 text-sm text-[#5f000b]/80">{product.weight || "—"}</td>
                      <td className="py-2 text-sm text-[#5f000b]/80">{product.leadTime || "—"}</td>
                      <td className="py-2">{product.status}</td>
                      <td className="py-2 text-sm text-[#5f000b]/70">{product.slug}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            className="rounded-full border border-[#5f000b] px-3 py-1 text-xs font-semibold uppercase text-[#5f000b] hover:bg-white/60"
                          >
                            Редактирай
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            disabled={deletingProductId === product.id}
                            className="rounded-full border border-[#b42318] px-3 py-1 text-xs font-semibold uppercase text-[#b42318] hover:bg-[#b42318]/10 disabled:opacity-60"
                          >
                            {deletingProductId === product.id ? "Изтриваме..." : "Изтрий"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
