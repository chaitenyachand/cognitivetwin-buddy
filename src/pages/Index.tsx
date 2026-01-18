import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  Mic, 
  BookOpen, 
  TrendingUp, 
  Sparkles, 
  Trophy, 
  Users, 
  Zap,
  Star,
  Target,
  Flame,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Mic,
      title: "Voice-First Learning",
      description: "Have natural conversations with your AI tutor. Speak your questions and get instant, personalized explanations.",
      gradient: "from-listening to-listening/70"
    },
    {
      icon: Brain,
      title: "Adaptive Intelligence",
      description: "AI that understands your learning style and adapts content difficulty in real-time.",
      gradient: "from-primary to-secondary"
    },
    {
      icon: Target,
      title: "Spaced Repetition",
      description: "SM-2 algorithm ensures you review at the perfect moment for maximum retention.",
      gradient: "from-secondary to-accent"
    },
    {
      icon: Trophy,
      title: "Gamified Progress",
      description: "Earn XP, unlock badges, maintain streaks, and compete on leaderboards.",
      gradient: "from-accent to-primary"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Learners" },
    { value: "95%", label: "Retention Rate" },
    { value: "500+", label: "Topics Mastered" },
    { value: "4.9★", label: "User Rating" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Medical Student",
      content: "The voice tutor feels like having a personal professor available 24/7. My exam scores improved by 40%!",
      avatar: "PS"
    },
    {
      name: "Rahul Verma",
      role: "Engineering Student",
      content: "Spaced repetition + AI explanations = perfect combo. I actually remember what I study now.",
      avatar: "RV"
    },
    {
      name: "Ananya Patel",
      role: "CA Aspirant",
      content: "The gamification keeps me motivated. 127 day streak and counting!",
      avatar: "AP"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 overflow-hidden">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20 relative">
        {/* Animated background elements */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            Powered by Agora Conversational AI + GenAI
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6 gradient-text leading-tight"
          >
            Your Cognitive Twin
            <br />
            <span className="text-4xl md:text-5xl text-muted-foreground">for Accelerated Learning</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            An AI companion that learns with you through voice conversations, 
            adapts to your style, and uses science-backed techniques to help you 
            master any subject 3x faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 shadow-lg hover:shadow-xl transition-all group"
              onClick={() => navigate("/auth")}
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Learning Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 group"
              onClick={() => navigate("/auth")}
            >
              <Trophy className="w-5 h-5 mr-2" />
              View Leaderboard
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Supercharge Your Learning</h2>
            <p className="text-lg text-muted-foreground">
              Cutting-edge AI meets proven learning science
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Cards */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl cursor-pointer transition-all ${
                    activeFeature === index
                      ? "bg-card border-2 border-primary shadow-lg"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Preview */}
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-8 border-2 shadow-2xl"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${features[activeFeature].gradient} flex items-center justify-center shadow-xl`}
                >
                  {(() => {
                    const Icon = features[activeFeature].icon;
                    return <Icon className="w-12 h-12 text-white" />;
                  })()}
                </motion.div>
                
                {/* Animated rings */}
                {[1, 2, 3].map((ring) => (
                  <motion.div
                    key={ring}
                    className="absolute inset-0 rounded-full border-2 border-primary/20"
                    animate={{
                      scale: [1, 1.5 + ring * 0.3],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: ring * 0.4,
                    }}
                    style={{
                      width: 100 + ring * 40,
                      height: 100 + ring * 40,
                      left: `calc(50% - ${50 + ring * 20}px)`,
                      top: `calc(50% - ${50 + ring * 20}px)`,
                    }}
                  />
                ))}
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-2">{features[activeFeature].title}</h3>
              <p className="text-muted-foreground">{features[activeFeature].description}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Three simple steps to accelerated learning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Mic,
                title: "Speak Your Topic",
                description: "Tell the AI what you want to learn. Upload PDFs, describe concepts, or just have a conversation.",
                gradient: "from-listening to-listening/70"
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Creates Materials",
                description: "Instantly generates summaries, mind maps, flashcards, and quizzes tailored to your level.",
                gradient: "from-primary to-secondary"
              },
              {
                step: "03",
                icon: Flame,
                title: "Learn & Level Up",
                description: "Practice with spaced repetition, take viva exams, earn XP, and watch your knowledge grow.",
                gradient: "from-secondary to-accent"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="border-2 hover-lift h-full">
                  <CardContent className="pt-8">
                    <div className="text-6xl font-bold text-muted/30 absolute top-4 right-4">
                      {item.step}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gamification Preview */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Stay Motivated, Level Up</h2>
            <p className="text-lg text-muted-foreground">
              Gamification that makes learning addictive
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Flame, label: "Daily Streaks", value: "127 Days", color: "text-orange-500" },
              { icon: Zap, label: "Total XP", value: "24,500", color: "text-yellow-500" },
              { icon: Trophy, label: "Badges Earned", value: "18", color: "text-purple-500" },
              { icon: Star, label: "Global Rank", value: "#42", color: "text-blue-500" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-card p-6 rounded-2xl border-2 text-center"
              >
                <item.icon className={`w-10 h-10 mx-auto mb-3 ${item.color}`} />
                <p className="text-3xl font-bold">{item.value}</p>
                <p className="text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by Students</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands who've transformed their learning
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="border-2 hover-lift h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                    <div className="flex gap-1 mt-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 rounded-3xl p-12 text-center border-2 relative overflow-hidden"
        >
          {/* Animated sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 30}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              <Sparkles className="w-6 h-6 text-primary/40" />
            </motion.div>
          ))}

          <h2 className="text-4xl font-bold mb-6 gradient-text relative z-10">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto relative z-10">
            Start your journey with Cognitive Twin today. 
            Join the AI-powered learning revolution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary text-white px-12 shadow-lg hover:shadow-xl transition-all group"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground relative z-10">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Free Forever Plan
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Instant Access
            </span>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Cognitive Twin</span>
          </div>
          <p className="text-muted-foreground">
            Built for the Economic Times GenAI Hackathon 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;