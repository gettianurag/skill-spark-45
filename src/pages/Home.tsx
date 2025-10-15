import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Users, Code, Palette, Video } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingSkills, setTrendingSkills] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    fetchTrendingSkills();

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrendingSkills = async () => {
    const { data } = await supabase
      .from("skills")
      .select("*, user_skills(count)")
      .limit(8);
    
    if (data) setTrendingSkills(data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSkillClick = (skillName: string) => {
    navigate(`/search?q=${encodeURIComponent(skillName)}`);
  };

  const categoryIcons: any = {
    Programming: Code,
    Design: Palette,
    Media: Video,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Study Partner
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect with talented students, share skills, and collaborate on amazing projects together.
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by skill (e.g., Python, Design...)"
                  className="pl-10 h-12 text-base shadow-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-medium"
              >
                Search
              </Button>
            </form>

            <div className="flex gap-4 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">100+</div>
                <div className="text-sm text-muted-foreground">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">250+</div>
                <div className="text-sm text-muted-foreground">Collaborations</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl -z-10" />
            <img
              src={heroImage}
              alt="Students collaborating"
              className="rounded-2xl shadow-strong w-full"
            />
          </div>
        </div>
      </section>

      {/* Trending Skills */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold">Trending Skills</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trendingSkills.map((skill) => {
            const Icon = categoryIcons[skill.category] || Users;
            return (
              <Card
                key={skill.id}
                className="cursor-pointer hover:shadow-medium transition-all hover:scale-105 group"
                onClick={() => handleSkillClick(skill.name)}
              >
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{skill.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {skill.category}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary to-secondary text-white shadow-strong">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Start Collaborating?</h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join hundreds of students already connecting and building amazing projects together.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 shadow-medium"
              onClick={() => navigate(user ? "/profile/setup" : "/auth")}
            >
              {user ? "Complete Your Profile" : "Get Started Free"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
