import { useState } from "react";
import { Card } from "@/components/ui/card";

interface FlipCardProps {
  front: string;
  back: string;
}

const FlipCard = ({ front, back }: FlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        {/* Front */}
        <Card 
          className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Question</p>
            <p className="text-lg font-medium text-foreground">{front}</p>
          </div>
        </Card>
        
        {/* Back */}
        <Card 
          className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20"
          style={{ 
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Answer</p>
            <p className="text-base text-foreground">{back}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FlipCard;
