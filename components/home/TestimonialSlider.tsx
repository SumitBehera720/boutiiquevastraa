"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

const testimonials = [
  {
    id: 1,
    name: "Aarti Sharma",
    review: "Absolutely in love with the saree I purchased. The quality of the fabric is premium and the golden border gives it a royal touch. Highly recommended!",
    location: "Mumbai, India",
    rating: 5,
  },
  {
    id: 2,
    name: "Priya Singh",
    review: "The Lehenga is stunning! It fits perfectly and looks exactly like the picture. The customer service was also very helpful with sizing.",
    location: "Delhi, India",
    rating: 5,
  },
  {
    id: 3,
    name: "Sneha Reddy",
    review: "Beautiful collection. I ordered a Kurti for a family function and received so many compliments. Will definitely shop here again.",
    location: "Hyderabad, India",
    rating: 4,
  }
];

export default function TestimonialSlider() {
  return (
    <section className="py-20 bg-[#FDFBF7]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-primary font-bold mb-12">
          What Our Customers Say
        </h2>
        
        <div className="max-w-4xl mx-auto">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {testimonials.map((t) => (
              <SwiperSlide key={t.id}>
                <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 mx-4 flex flex-col items-center">
                  <div className="text-secondary text-2xl mb-4">
                    {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
                  </div>
                  <p className="text-gray-600 italic text-lg md:text-xl mb-6 leading-relaxed">
                    "{t.review}"
                  </p>
                  <h4 className="font-bold font-sans text-gray-800">{t.name}</h4>
                  <span className="text-sm text-gray-500">{t.location}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
