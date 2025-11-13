import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Mic, BookOpen, TrendingUp, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by Agora Conversational AI
          </div>
          
          <h1 className="text-6xl font-bold mb-6 gradient-text leading-tight">
            Your Personal AI Study Partner
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Learn naturally through voice conversations with an AI tutor that adapts to your pace, 
            explains concepts clearly, and helps you master any subject.
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/auth")}
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Learning Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2"
              onClick={() => navigate("/auth")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              A voice-first learning experience designed for natural, effective learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border-2 hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-listening to-listening/70 flex items-center justify-center mb-6">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Speak Naturally</h3>
              <p className="text-muted-foreground leading-relaxed">
                Just talk about what you want to learn. The AI listens, understands, 
                and responds like a real tutor.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border-2 hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Adaptive Learning</h3>
              <p className="text-muted-foreground leading-relaxed">
                AI analyzes your understanding and adapts explanations, creates summaries, 
                mindmaps, and quizzes tailored to you.
              </p>
            </div>

            <div className="bg-card p-8 rounded-2xl border-2 hover-lift">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Track Progress</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your learning journey, identify weak areas, and get personalized 
                recommendations for improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-12 text-center border-2">
          <h2 className="text-4xl font-bold mb-6 gradient-text">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are learning faster and more effectively 
            with their personal AI tutor.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary text-white px-12 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/auth")}
          >
            Get Started Free
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
