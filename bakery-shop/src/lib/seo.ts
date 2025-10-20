type SeoConfig = {
  title: string;
  description: string;
  url: string;
  images?: Array<{ url: string; alt: string }>;
};

export function buildSeoMetadata(config: SeoConfig) {
  const { title, description, url, images = [] } = config;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export function buildProductJsonLd(options: {
  name: string;
  description: string;
  sku: string;
  url: string;
  price: string;
  currency: string;
  availability?: string;
}) {
  const { name, description, sku, url, price, currency, availability = "InStock" } =
    options;

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    description,
    sku,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price,
      availability: `https://schema.org/${availability}`,
    },
  };
}
