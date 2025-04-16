
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  className?: string;
  editable?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  color = "text-yellow-400",
  className = "",
  editable = false,
  onChange
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (editable && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      {Array.from({ length: maxRating }).map((_, index) => (
        <Star
          key={index}
          size={size}
          className={`
            ${color} 
            ${index < rating ? "fill-current" : "fill-transparent"}
            ${editable ? "cursor-pointer transition-transform hover:scale-110" : ""}
          `}
          onClick={() => handleClick(index)}
          data-testid={`star-${index + 1}`}
        />
      ))}
    </div>
  );
}
