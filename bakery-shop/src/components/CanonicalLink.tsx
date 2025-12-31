"use client";

import Head from "next/head";
import { usePathname } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://noregrets.bg";

export default function CanonicalLink() {
  const pathname = usePathname() || "/";
  const href = `${SITE_URL.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

  return (
    <Head>
      <link rel="canonical" href={href} />
    </Head>
  );
}
