"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, useState } from "react";

const VISIBLE_CARD_COUNT = 3;

type Review = {
  id: number;
  author: string;
  content: string;
  productName: string;
  productImage: StaticImageData | string;
};

type ReviewsCarouselProps = {
  reviews: Review[];
};

const ReviewsCarousel = ({ reviews }: ReviewsCarouselProps) => {
  const total = reviews.length;
  const [startIndex, setStartIndex] = useState(0);
  const canNavigate = total > VISIBLE_CARD_COUNT;

  const wrapIndex = (index: number) => {
    if (total === 0) {
      return 0;
    }
    return (index + total) % total;
  };

  const visibleReviews = useMemo(() => {
    const count = Math.min(VISIBLE_CARD_COUNT, total);
    return Array.from({ length: count }, (_, idx) => reviews[wrapIndex(startIndex + idx)]);
  }, [startIndex, total, reviews]);

  const handlePrev = () => {
    if (!canNavigate) return;
    setStartIndex((prev) => wrapIndex(prev - 1));
  };

  const handleNext = () => {
    if (!canNavigate) return;
    setStartIndex((prev) => wrapIndex(prev + 1));
  };

  return (
    <section className="py-20">
      <div className="w-full px-[clamp(1rem,3vw,3rem)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold uppercase tracking-[0.2em]">Потвърдени отзиви</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Истории от нашите клиенти</h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              aria-label="Предишен отзив"
              onClick={handlePrev}
              disabled={!canNavigate}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcb1b1] bg-white transition hover:-translate-y-0.5 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Следващ отзив"
              onClick={handleNext}
              disabled={!canNavigate}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dcb1b1] bg-white transition hover:-translate-y-0.5 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {visibleReviews.map((review) => (
            <article key={review.id} className="flex h-full flex-col justify-between rounded-s bg-white p-8 shadow-card">
              <div className="space-y-4">
                <h6 className="text-base font-semibold">{review.author}</h6>
                <p className="leading-relaxed text-sm">{review.content}</p>
              </div>
              <div className="mt-6 border-t border-[#f3d2c4] pt-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={review.productImage}
                    alt={review.productName}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <span className="text-sm font-semibold">{review.productName}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsCarousel;
