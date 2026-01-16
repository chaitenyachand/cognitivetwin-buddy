import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Copy, LogIn, Crown, UserCheck } from "lucide-react";

interface StudyGroup {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  max_members: number;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
  role?: string;
}

const StudyGroups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadGroups(session.user.id);
      }
    });
  }, [navigate]);

  const loadGroups = async (userId: string) => {
    try {
      // Load groups user is a member of
      const { data: membershipData, error: memberError } = await supabase
        .from("study_group_members")
        .select("group_id, role")
        .eq("user_id", userId);

      if (memberError) throw memberError;

      const memberGroupIds = membershipData?.map(m => m.group_id) || [];
      const memberRoles = new Map(membershipData?.map(m => [m.group_id, m.role]));

      // Load all groups (public or created by user)
      const { data: groupsData, error: groupsError } = await supabase
        .from("study_groups")
        .select("*")
        .or(`is_public.eq.true,created_by.eq.${userId}`);

      if (groupsError) throw groupsError;

      const processedGroups = (groupsData || []).map(group => ({
        ...group,
        is_member: memberGroupIds.includes(group.id),
        role: memberRoles.get(group.id) || null,
      }));

      setGroups(processedGroups.filter(g => !g.is_member));
      setMyGroups(processedGroups.filter(g => g.is_member));
    } catch (error: any) {
      toast({
        title: "Error loading groups",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: newGroup, error: createError } = await supabase
        .from("study_groups")
        .insert({
          name: newGroupName,
          description: newGroupDescription,
          invite_code: inviteCode,
          created_by: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as admin member
      await supabase.from("study_group_members").insert({
        group_id: newGroup.id,
        user_id: user.id,
        role: "admin",
      });

      toast({
        title: "Group created!",
        description: `Invite code: ${inviteCode}`,
      });

      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      loadGroups(user.id);
    } catch (error: any) {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const joinGroup = async (groupId?: string, code?: string) => {
    if (!user) return;

    try {
      let targetGroupId = groupId;

      if (code) {
        const { data: group, error: findError } = await supabase
          .from("study_groups")
          .select("id")
          .eq("invite_code", code.toUpperCase())
          .maybeSingle();

        if (findError || !group) {
          toast({
            title: "Invalid invite code",
            description: "Please check the code and try again",
            variant: "destructive",
          });
          return;
        }
        targetGroupId = group.id;
      }

      if (!targetGroupId) return;

      const { error } = await supabase.from("study_group_members").insert({
        group_id: targetGroupId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      toast({
        title: "Joined group!",
        description: "Welcome to the study group",
      });

      setJoinDialogOpen(false);
      setJoinCode("");
      loadGroups(user.id);
    } catch (error: any) {
      toast({
        title: "Error joining group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      <Sidebar user={user} />

      <div className="flex-1 ml-64">
        <div className="border-b border-border bg-gradient-to-r from-card/50 via-card/80 to-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="px-8 py-8">
            <h1 className="text-4xl font-bold gradient-text">Study Groups</h1>
            <p className="text-muted-foreground mt-2">Learn together, grow together</p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Action buttons */}
          <div className="flex gap-4">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Group Name</Label>
                    <Input
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="e.g., Physics Study Squad"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={newGroupDescription}
                      onChange={e => setNewGroupDescription(e.target.value)}
                      placeholder="What will you study together?"
                    />
                  </div>
                  <Button onClick={createGroup} disabled={!newGroupName.trim()} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Join with Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join Study Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Invite Code</Label>
                    <Input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
                      maxLength={6}
                    />
                  </div>
                  <Button onClick={() => joinGroup(undefined, joinCode)} disabled={joinCode.length !== 6} className="w-full">
                    Join Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* My Groups */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              My Groups
            </h2>
            {myGroups.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>You haven't joined any groups yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myGroups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          {group.role === "admin" && (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>Invite: {group.invite_code}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInviteCode(group.invite_code)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Public Groups */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-secondary" />
              Discover Groups
            </h2>
            {groups.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No public groups available</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group, index) => (
                  <motion.div
                    key={group.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <Button
                          size="sm"
                          onClick={() => joinGroup(group.id)}
                          className="w-full gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          Join Group
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyGroups;
