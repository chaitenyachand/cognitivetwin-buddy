import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

interface TopicProgressCardProps {
  topic: string;
  progress: number;
}

const TopicProgressCard = ({ topic, progress }: TopicProgressCardProps) => {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary bg-gradient-to-r from-card to-card/50">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{topic}</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Mastery Level</span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicProgressCard;
