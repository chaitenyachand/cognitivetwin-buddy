import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopicProgressCardProps {
  topic: string;
  progress: number;
}

const TopicProgressCard = ({ topic, progress }: TopicProgressCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-1 h-16 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-foreground">{topic}</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Mastery Level</span>
                <span className="font-semibold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicProgressCard;
