import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRate?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingStars({ 
  rating, 
  maxRating = 5, 
  onRate, 
  readOnly = false,
  size = "md"
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const handleMouseEnter = (index: number) => {
    if (!readOnly) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (!readOnly) setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (!readOnly && onRate) onRate(index);
  };

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = hoverRating !== null ? starValue <= hoverRating : starValue <= Math.round(rating);
        
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <Star 
              className={`
                ${starSizes[size]} transition-colors duration-300
                ${isFilled ? 'fill-primary text-primary' : 'text-muted-foreground/30'}
              `} 
            />
          </button>
        );
      })}
    </div>
  );
}
