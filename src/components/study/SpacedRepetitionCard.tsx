import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RotateCcw, ThumbsDown, Meh, ThumbsUp, Zap } from "lucide-react";

interface SpacedRepetitionCardProps {
  front: string;
  back: string;
  onRate: (quality: number) => void;
  cardNumber: number;
  totalCards: number;
}

// SM-2 quality ratings
const ratings = [
  { value: 0, label: "Again", icon: RotateCcw, color: "bg-red-500 hover:bg-red-600", description: "Forgot completely" },
  { value: 2, label: "Hard", icon: ThumbsDown, color: "bg-orange-500 hover:bg-orange-600", description: "Remembered with difficulty" },
  { value: 3, label: "Good", icon: Meh, color: "bg-yellow-500 hover:bg-yellow-600", description: "Remembered with some effort" },
  { value: 5, label: "Easy", icon: ThumbsUp, color: "bg-green-500 hover:bg-green-600", description: "Remembered easily" },
];

const SpacedRepetitionCard = ({ front, back, onRate, cardNumber, totalCards }: SpacedRepetitionCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleRate = (quality: number) => {
    setIsExiting(true);
    setTimeout(() => {
      onRate(quality);
      setIsFlipped(false);
      setIsExiting(false);
    }, 300);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-4">
        <span className="text-sm text-muted-foreground">
          Card {cardNumber} of {totalCards}
        </span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={isExiting ? "exiting" : "visible"}
          initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 200 }}
          transition={{ duration: 0.3 }}
          className="perspective-1000"
        >
          <div
            onClick={() => !isFlipped && setIsFlipped(true)}
            className={`relative cursor-pointer ${!isFlipped ? "hover:scale-[1.02] transition-transform" : ""}`}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front of card */}
              <Card
                className={`min-h-[300px] border-none shadow-xl bg-gradient-to-br from-primary/10 to-secondary/10 ${
                  isFlipped ? "invisible" : ""
                }`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
                  <p className="text-xl font-medium">{front}</p>
                  <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
                </CardContent>
              </Card>

              {/* Back of card */}
              <Card
                className={`min-h-[300px] border-none shadow-xl bg-gradient-to-br from-secondary/10 to-accent/10 absolute inset-0 ${
                  !isFlipped ? "invisible" : ""
                }`}
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-8 text-center">
                  <p className="text-xl font-medium">{back}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <p className="text-center text-sm text-muted-foreground mb-4">How well did you remember?</p>
          <div className="grid grid-cols-4 gap-3">
            {ratings.map(rating => (
              <motion.div key={rating.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleRate(rating.value)}
                  className={`w-full h-auto py-3 flex flex-col gap-1 ${rating.color} text-white`}
                >
                  <rating.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{rating.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SpacedRepetitionCard;
