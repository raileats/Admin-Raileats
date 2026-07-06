"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Slider from "react-slick";

type HeroSlide = {
  id: number | string;
  title: string | null;
  image_url: string;
  sort_order?: number | null;
};

type HeroSliderApiResponse = {
  success: boolean;
  data?: HeroSlide[];
  error?: string;
};

const fallbackSlides: HeroSlide[] = [
  {
    id: "fallback-happy-new-year",
    title: "RailEats special offers",
    image_url: "/slides/happy-new-year.png",
    sort_order: 1,
  },
  {
    id: "fallback-offer50",
    title: "Flat Rs 50 off on train food orders",
    image_url: "/slides/offer50.png",
    sort_order: 2,
  },
  {
    id: "fallback-offer20",
    title: "Flat Rs 20 off on train food orders",
    image_url: "/slides/offer20.png",
    sort_order: 3,
  },
  {
    id: "fallback-offer-combo",
    title: "Combo meals for every train journey",
    image_url: "/slides/offer-combo.png",
    sort_order: 4,
  },
  {
    id: "fallback-hot-fresh",
    title: "Hot and fresh food delivered in train",
    image_url: "/slides/hot-fresh.png",
    sort_order: 5,
  },
];

const sliderSettings = {
  dots: true,
  infinite: true,
  autoplay: true,
  autoplaySpeed: 3500,
  speed: 600,
  slidesToShow: 1,
  slidesToScroll: 1,
  arrows: false,
  pauseOnHover: true,
};

export default function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadSliders() {
      try {
        const response = await fetch("/api/hero-slider", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as HeroSliderApiResponse;

        if (ignore) return;

        if (response.ok && result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setSlides(result.data);
        } else {
          setSlides(fallbackSlides);
        }
      } catch {
        if (!ignore) setSlides(fallbackSlides);
      } finally {
        if (!ignore) setLoaded(true);
      }
    }

    loadSliders();

    return () => {
      ignore = true;
    };
  }, []);

  const normalizedSlides = useMemo(() => {
    const validSlides = slides.filter((slide) => slide.image_url);
    return validSlides.length > 0 ? validSlides : fallbackSlides;
  }, [slides]);

  return (
    <section className="hero-slider-section" aria-label="RailEats offers">
      <Slider {...sliderSettings}>
        {normalizedSlides.map((slide, index) => {
          const title = slide.title || "RailEats train food delivery offer";

          return (
            <div key={slide.id || `${slide.image_url}-${index}`} className="hero-slider-item">
              <div className="slider-img">
                <Image
                  src={slide.image_url}
                  alt={title}
                  title={title}
                  fill
                  sizes="(max-width: 768px) 100vw, 1120px"
                  priority={index === 0}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="object-fit-cover"
                  unoptimized={slide.image_url.startsWith("http")}
                />
              </div>
            </div>
          );
        })}
      </Slider>

      {!loaded && <span className="visually-hidden">Loading RailEats offers...</span>}
    </section>
  );
}
