import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  location: string;
  rating: number;
  comment: string;
  index?: number;
}

export function TestimonialCard({ name, location, rating, comment, index = 0 }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative group"
    >
      {/* Quote Icon */}
      <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Quote className="w-16 h-16 text-[#2563EB]" />
      </div>

      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? "text-[#F59E0B] fill-[#F59E0B]"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-700 leading-relaxed mb-6 relative z-10">
        "{comment}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#38BDF8] flex items-center justify-center text-white font-semibold shadow-md">
          {name.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-[#0F1F3D]">{name}</div>
          <div className="text-sm text-gray-500">{location}</div>
        </div>
      </div>
    </motion.div>
  );
}
