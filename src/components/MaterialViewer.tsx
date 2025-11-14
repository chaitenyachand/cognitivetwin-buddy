import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

interface MaterialViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "summary" | "mindmap" | "flashcards" | "formula_sheet" | "quiz";
  content: any;
  topicName: string;
}

const MaterialViewer = ({ open, onOpenChange, type, content, topicName }: MaterialViewerProps) => {
  const renderContent = () => {
    switch (type) {
      case "summary":
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );

      case "mindmap":
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        );

      case "flashcards":
        return (
          <div className="space-y-4">
            {content.map((card: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">Question</Badge>
                      <p className="text-foreground font-medium">{card.front}</p>
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Answer</Badge>
                      <p className="text-muted-foreground">{card.back}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
        return (
          <div className="space-y-6">
            {content?.questions?.map((question: any, index: number) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">Question {index + 1}</Badge>
                      <p className="text-foreground font-medium">{question.question}</p>
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option: string, optIndex: number) => (
                        <div 
                          key={optIndex}
                          className={`p-3 rounded-md border ${
                            optIndex === question.correct 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                              : 'border-border'
                          }`}
                        >
                          <p className="text-sm">{option}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Explanation</Badge>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
