import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "No Regrets – Сладкарско ателие в Пловдив",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ffe0ea] text-[#5f000b]">
      <main className="flex flex-1 items-center justify-center">
        <p className="text-4xl font-semibold uppercase tracking-widest">Coming Soon</p>
      </main>
    </div>
  );
}
