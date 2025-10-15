import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search as SearchIcon, Mail, ExternalLink } from "lucide-react";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Search for skills matching the query
      const { data: skills } = await supabase
        .from("skills")
        .select("id, name")
        .ilike("name", `%${query}%`);

      if (skills && skills.length > 0) {
        const skillIds = skills.map(s => s.id);
        
        // Get users with these skills
        const { data: userSkills } = await supabase
          .from("user_skills")
          .select(`
            user_id,
            skill_id,
            profiles (
              id,
              full_name,
              department,
              year_of_study,
              bio,
              email,
              linkedin_url
            ),
            skills (
              name
            )
          `)
          .in("skill_id", skillIds);

        if (userSkills) {
          // Group by user
          const userMap = new Map();
          userSkills.forEach((us: any) => {
            if (!us.profiles) return;
            
            const userId = us.profiles.id;
            if (!userMap.has(userId)) {
              userMap.set(userId, {
                ...us.profiles,
                skills: []
              });
            }
            userMap.get(userId).skills.push(us.skills.name);
          });

          setResults(Array.from(userMap.values()));
        }
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Find Students by Skill
          </h1>

          <form onSubmit={handleSearch} className="mb-12">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by skill (e.g., Python, UI Design, Video Editing...)"
                className="pl-12 h-14 text-base shadow-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Found {results.length} student{results.length !== 1 ? "s" : ""} with "{searchParams.get("q")}"
              </p>

              <div className="grid gap-6">
                {results.map((profile) => (
                  <Card
                    key={profile.id}
                    className="hover:shadow-medium transition-all cursor-pointer group"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-6">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                          <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                            {getInitials(profile.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                              {profile.full_name}
                            </h3>
                            <p className="text-muted-foreground">
                              {profile.department} • {profile.year_of_study}
                            </p>
                          </div>

                          {profile.bio && (
                            <p className="text-sm line-clamp-2">{profile.bio}</p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill: string, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex gap-3 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${profile.email}`;
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                            {profile.linkedin_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(profile.linkedin_url, "_blank");
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                LinkedIn
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : searchParams.get("q") ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-xl text-muted-foreground">
                No students found with the skill "{searchParams.get("q")}"
              </p>
              <p className="text-sm text-muted-foreground">
                Try searching for a different skill or browse trending skills on the home page
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Search;
