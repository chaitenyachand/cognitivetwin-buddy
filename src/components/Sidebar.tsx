import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, MessageSquare, Mic, LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  user: User | null;
}

const Sidebar = ({ user }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/auth");
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/start-topic", icon: Plus, label: "Start New Topic" },
    { path: "/qa", icon: MessageSquare, label: "Ask a General Question" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">
          Welcome,
          <br />
          {user?.user_metadata?.name || "Student"}!
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </Button>
        ))}

        {/* AI Voice Tutor Section */}
        <div className="pt-6">
          <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 flex items-center">
            <span className="text-lg mr-2">✨</span> AI Voice Tutor
          </p>
          <Button
            variant="default"
            className="w-full justify-start bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            onClick={() => navigate("/voice-tutor")}
          >
            <Mic className="w-5 h-5 mr-3" />
            Start Socratic Session
          </Button>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
