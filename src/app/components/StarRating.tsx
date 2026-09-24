import { Star } from 'lucide-react';

export function StarRating({ experience }: { experience: string | number | undefined }) {
  if (!experience) return null;

  const years = typeof experience === 'string' ? parseInt(experience, 10) : experience;
  if (isNaN(years)) return null;

  // Calculate stars: 1 year = 1 star, max 5 stars
  const starCount = Math.min(Math.ceil(years / 2), 5);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < starCount ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="text-xs text-gray-600 ml-1">({years}y experience)</span>
    </div>
  );
}
