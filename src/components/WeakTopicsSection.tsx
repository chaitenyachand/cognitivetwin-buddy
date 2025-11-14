import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, BookOpen, Brain, CreditCard, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeakTopic {
  id: string;
  topic_id: string;
  topic_name: string;
  weak_area: string;
  identified_from: string;
  score: number;
  notes: string;
  created_at: string;
  addressed: boolean;
}

interface WeakTopicsSectionProps {
  userId: string;
  onViewMaterial: (topicId: string, topicName: string, materialType: any) => void;
}

const WeakTopicsSection = ({ userId, onViewMaterial }: WeakTopicsSectionProps) => {
  const { toast } = useToast();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadWeakTopics();
    }
  }, [userId]);

  const loadWeakTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('weak_topics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeakTopics(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading weak topics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsAddressed = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weak_topics')
        .update({ addressed: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Progress updated",
        description: "Marked as addressed",
      });

      loadWeakTopics();
    } catch (error: any) {
      toast({
        title: "Error updating",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getIdentifiedFromIcon = (source: string) => {
    switch (source) {
      case 'viva_test':
        return <Brain className="w-4 h-4" />;
      case 'quiz':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getIdentifiedFromText = (source: string) => {
    switch (source) {
      case 'viva_test':
        return 'Viva Test';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Manual';
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading weak areas...</p>;
  }

  const unaddressedTopics = weakTopics.filter(t => !t.addressed);
  const addressedTopics = weakTopics.filter(t => t.addressed);

  return (
    <div className="space-y-6">
      {/* Unaddressed weak topics */}
      {unaddressedTopics.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-semibold mb-2">Great job!</p>
            <p>No weak areas identified. Keep up the excellent work!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Needs Attention ({unaddressedTopics.length})
          </h3>
          {unaddressedTopics.map((weak) => (
            <Card key={weak.id} className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-foreground">{weak.weak_area}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {weak.topic_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          {getIdentifiedFromIcon(weak.identified_from)}
                          <span>{getIdentifiedFromText(weak.identified_from)}</span>
                        </div>
                        {weak.score !== null && (
                          <Badge variant="outline">Score: {weak.score}/100</Badge>
                        )}
                      </div>
                      {weak.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {weak.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {weak.topic_id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewMaterial(weak.topic_id, weak.topic_name, 'summary')}
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Review Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewMaterial(weak.topic_id, weak.topic_name, 'flashcards')}
                        >
                          <CreditCard className="w-4 h-4 mr-1" />
                          Flashcards
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewMaterial(weak.topic_id, weak.topic_name, 'mindmap')}
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          Mindmap
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsAddressed(weak.id)}
                      className="ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark as Addressed
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Addressed topics */}
      {addressedTopics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Addressed ({addressedTopics.length})
          </h3>
          {addressedTopics.map((weak) => (
            <Card key={weak.id} className="opacity-60 border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{weak.weak_area}</h4>
                    <p className="text-sm text-muted-foreground">{weak.topic_name}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    Addressed
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeakTopicsSection;
