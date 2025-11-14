import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import MindmapViewer from "./MindmapViewer";
import FlipCard from "./FlipCard";
import InteractiveQuiz from "./InteractiveQuiz";

interface MaterialViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "summary" | "mindmap" | "flashcards" | "formula_sheet" | "quiz";
  content: any;
  topicName: string;
  topicId?: string;
  userId?: string;
}

const MaterialViewer = ({ open, onOpenChange, type, content, topicName, topicId, userId }: MaterialViewerProps) => {
  const renderContent = () => {
    switch (type) {
      case "summary":
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );

      case "mindmap":
        if (content && typeof content === 'object' && 'nodes' in content && 'edges' in content) {
          return <MindmapViewer nodes={content.nodes} edges={content.edges} />;
        }
        return <p className="text-muted-foreground">No mindmap available</p>;

      case "flashcards":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content?.map((card: any, index: number) => (
              <FlipCard key={index} front={card.front} back={card.back} />
            ))}
          </div>
        );

      case "formula_sheet":
        return (
          <div className="space-y-4">
            {content?.formulas?.map((formula: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-foreground mb-2">{formula.name}</h4>
                  <p className="font-mono text-sm bg-muted p-2 rounded mb-2">{formula.formula}</p>
                  <p className="text-sm text-muted-foreground mb-1">{formula.description}</p>
                  {formula.example && <p className="text-xs text-muted-foreground italic">Example: {formula.example}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "quiz":
        if (!topicId || !userId) {
          return <p className="text-muted-foreground">Unable to load quiz</p>;
        }
        return (
          <InteractiveQuiz 
            questions={content?.questions || []} 
            topicId={topicId}
            userId={userId}
          />
        );

      default:
        return <p>No content available</p>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "summary": return "Summary";
      case "mindmap": return "Mind Map";
      case "flashcards": return "Flashcards";
      case "formula_sheet": return "Formula Sheet";
      case "quiz": return "Quiz";
      default: return "Content";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getTitle()} - {topicName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialViewer;
