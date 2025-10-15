import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState<{
    full_name: string;
    department: string;
    year_of_study: "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Masters" | "PhD" | "";
    bio: string;
    email: string;
    linkedin_url: string;
    phone: string;
  }>({
    full_name: "",
    department: "",
    year_of_study: "",
    bio: "",
    email: "",
    linkedin_url: "",
    phone: "",
  });
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    };

    const fetchSkills = async () => {
      const { data } = await supabase.from("skills").select("*").order("name");
      if (data) setAvailableSkills(data);
    };

    getUser();
    fetchSkills();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create profile
      const profileData = {
        id: userId,
        ...formData,
        year_of_study: formData.year_of_study as "1st Year" | "2nd Year" | "3rd Year" | "4th Year" | "Masters" | "PhD"
      };
      
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([profileData]);

      if (profileError) throw profileError;

      // Add selected skills
      if (selectedSkills.length > 0) {
        const userSkills = selectedSkills.map(skillId => ({
          user_id: userId,
          skill_id: skillId,
        }));

        const { error: skillsError } = await supabase
          .from("user_skills")
          .insert(userSkills);

        if (skillsError) throw skillsError;
      }

      toast({
        title: "Profile created!",
        description: "Welcome to SkillHub!",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const { data, error } = await supabase
        .from("skills")
        .insert([{ name: newSkill, category: "Other" }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAvailableSkills([...availableSkills, data]);
        setSelectedSkills([...selectedSkills, data.id]);
        setNewSkill("");
        toast({
          title: "Skill added!",
          description: `${newSkill} has been added to your skills.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <Card className="max-w-2xl mx-auto shadow-strong">
        <CardHeader>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <CardDescription>Tell us about yourself and your skills</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="Computer Science"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_of_study">Year of Study *</Label>
              <Select
                value={formData.year_of_study}
                onValueChange={(value) => setFormData({ ...formData, year_of_study: value as any })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Year">1st Year</SelectItem>
                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                  <SelectItem value="4th Year">4th Year</SelectItem>
                  <SelectItem value="Masters">Masters</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Skills *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a custom skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addNewSkill())}
                />
                <Button type="button" onClick={addNewSkill} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/30 min-h-[100px]">
                {availableSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={selectedSkills.includes(skill.id) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleSkill(skill.id)}
                  >
                    {skill.name}
                    {selectedSkills.includes(skill.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
              {selectedSkills.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Select at least one skill or add your own
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              disabled={loading || selectedSkills.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
