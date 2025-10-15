import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, ExternalLink, Phone, Edit, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        if (!user) {
          navigate("/auth");
          return;
        }

        const profileId = id || user.id;
        setIsOwnProfile(!id || id === user.id);

        // Check if profile exists
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profileId)
          .single();

        if (profileError || !profileData) {
          if (isOwnProfile) {
            navigate("/profile/setup");
          } else {
            toast({
              title: "Profile not found",
              description: "This user hasn't set up their profile yet.",
              variant: "destructive",
            });
            navigate("/");
          }
          return;
        }

        setProfile(profileData);

        // Fetch user skills
        const { data: userSkills } = await supabase
          .from("user_skills")
          .select(`
            skills (
              id,
              name,
              category
            )
          `)
          .eq("user_id", profileId);

        if (userSkills) {
          setSkills(userSkills.map((us: any) => us.skills));
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate, toast]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Navbar user={currentUser} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar user={currentUser} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-strong">
            <CardHeader className="relative">
              <div className="absolute top-6 right-6">
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/profile/edit")}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="flex gap-6 items-start">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <CardTitle className="text-4xl">{profile.full_name}</CardTitle>
                  <p className="text-xl text-muted-foreground">
                    {profile.department}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    {profile.year_of_study}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {profile.bio && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                  <Separator />
                </>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge
                      key={skill.id}
                      variant="default"
                      className="text-sm px-4 py-2"
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <a
                      href={`mailto:${profile.email}`}
                      className="text-primary hover:underline"
                    >
                      {profile.email}
                    </a>
                  </div>

                  {profile.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={`tel:${profile.phone}`}
                        className="text-primary hover:underline"
                      >
                        {profile.phone}
                      </a>
                    </div>
                  )}

                  {profile.linkedin_url && (
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <>
                  <Separator />
                  <div className="flex gap-3">
                    <Button
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      onClick={() => window.location.href = `mailto:${profile.email}`}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </Button>
                    {profile.linkedin_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(profile.linkedin_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View LinkedIn
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
