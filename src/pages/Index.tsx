import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, Mic, Map, Sparkles, ArrowRight, Sun, Moon, LogOut, FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getResourcesForClassExam, type Resource } from "@/data/prepometerResources";
import { getQuizzesForClassExam } from "@/data/prepometerQuizzes";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import PracticeQuiz from "@/components/PracticeQuiz";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPrepometer, setShowPrepometer] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLearningResources, setShowLearningResources] = useState(false);
  const [showPracticeQuiz, setShowPracticeQuiz] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/notebooks");
      }
    });
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAddToNotebook = async (resource: Resource) => {
    if (!user) {
      toast.error("Please sign in to add resources to notebook");
      navigate("/auth");
      return;
    }

    try {
      // Create or get a notebook for this class-exam combination
      const notebookTitle = `Class ${selectedClass} - ${selectedExam}`;
      
      // Check if notebook already exists
      const { data: existingNotebooks } = await supabase
        .from("notebooks")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", notebookTitle)
        .limit(1);

      let notebookId: string;

      if (existingNotebooks && existingNotebooks.length > 0) {
        notebookId = existingNotebooks[0].id;
      } else {
        // Create new notebook
        const { data: newNotebook, error: notebookError } = await supabase
          .from("notebooks")
          .insert({
            user_id: user.id,
            title: notebookTitle,
            icon: "📚",
            color: "bg-blue-100 dark:bg-blue-950",
          })
          .select()
          .single();

        if (notebookError) throw notebookError;
        notebookId = newNotebook.id;
      }

      let resourceContent = resource.content || '';
      
      // Handle question papers - fetch from internet ONLY for Prepometer notebooks
      // Check if notebook title matches Prepometer pattern (Class X - Exam)
      const isPrepometerNotebook = notebookTitle.match(/^Class \d+ - .+$/);
      
      if (resource.type === 'pyq' && isPrepometerNotebook && selectedClass && selectedExam) {
        // Check if question paper already exists to avoid regenerating
        const { data: existingSources } = await supabase
          .from("sources")
          .select("id, title")
          .eq("notebook_id", notebookId)
          .ilike("title", `%${selectedExam}%`)
          .limit(1);

        if (existingSources && existingSources.length > 0) {
          // Question paper already exists, use existing content
          resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}${resource.year ? `Year: ${resource.year}\n` : ''}`;
          toast.info("Using existing question paper");
        } else {
          // Generate question paper only once
          toast.info(`Generating ${selectedExam} question paper...`);
          try {
            const { data: fetchedData, error: fetchError } = await supabase.functions.invoke("fetch-question-paper", {
              body: {
                class: selectedClass,
                exam: selectedExam,
                year: resource.year,
                title: resource.title,
              },
            });

            if (!fetchError && fetchedData?.content) {
              resourceContent = fetchedData.content;
              toast.success(`${selectedExam} question paper generated!`);
            } else {
              // Fallback to existing content if fetch fails
              resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}${resource.year ? `Year: ${resource.year}\n` : ''}`;
              toast.warning("Using cached content. Generation failed.");
            }
          } catch (fetchErr) {
            console.error("Error generating question paper:", fetchErr);
            resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}${resource.year ? `Year: ${resource.year}\n` : ''}`;
          }
        }
      } else if (resource.type === 'note' && isPrepometerNotebook && selectedClass && selectedExam) {
        // For notes in Prepometer notebooks, extract chapter names and generate AI notes
        toast.info("Generating AI-based notes for chapters...");
        try {
          // Extract chapter name from title or description
          const chapterMatch = resource.title.match(/(?:chapter|ch\.?)\s*(\d+[a-z]?|[\w\s]+)/i) || 
                              resource.description.match(/(?:chapter|ch\.?)\s*(\d+[a-z]?|[\w\s]+)/i);
          const chapterName = chapterMatch ? chapterMatch[1].trim() : resource.title;

          const { data: noteData, error: noteError } = await supabase.functions.invoke("generate-summary", {
            body: {
              text: `Generate comprehensive study notes for Class ${selectedClass} ${selectedExam} on the topic: ${chapterName}\n\nSubject: ${resource.subject || 'General'}\n\nCreate detailed notes covering:\n- Key concepts and definitions\n- Important formulas (if applicable)\n- Examples and explanations\n- Important points to remember`,
              mode: "exam",
            },
          });

          if (!noteError && noteData?.summary) {
            resourceContent = noteData.summary;
            toast.success("AI notes generated successfully!");
          } else {
            resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}`;
            toast.warning("Using default content. AI generation failed.");
          }
        } catch (noteErr) {
          console.error("Error generating notes:", noteErr);
          resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}`;
        }
      } else {
        // For non-Prepometer notebooks, use existing content
        resourceContent = resource.content || `${resource.title}\n\n${resource.description}\n\nType: ${resource.type}\n${resource.subject ? `Subject: ${resource.subject}\n` : ''}${resource.year ? `Year: ${resource.year}\n` : ''}`;
      }

      // Add resource as a source
      const { error: sourceError } = await supabase
        .from("sources")
        .insert({
          notebook_id: notebookId,
          title: resource.title,
          type: resource.type === 'pyq' ? 'text' : 'text',
          content: resourceContent,
        });

      if (sourceError) throw sourceError;

      toast.success(`${resource.title} added to notebook!`);
      navigate(`/workspace/${notebookId}`);
    } catch (error) {
      console.error("Error adding resource to notebook:", error);
      toast.error("Failed to add resource to notebook");
    }
  };
  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      setIsDark(true);
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Top Header */}
      <div className="fixed top-0 left-0 w-full z-50 bg-background/60 backdrop-blur-md shadow flex items-center h-16">
        <div className="absolute right-0 top-0 flex items-center h-16 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrepometer(true)}
            className="gap-2 mr-1"
          >
            <span className="text-2xl">📈</span>
            Prepometer
          </Button>
          <button
            onClick={toggleTheme}
            className={`rounded-full p-2 transition-colors flex items-center justify-center hover:bg-accent/70 focus:outline-none focus:ring-2 focus:ring-primary/40 ${isDark ? "bg-muted" : "bg-accent"}`}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
          </button>
          <Button variant="outline" size="sm" onClick={signOut} className="gap-2 ml-1">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
      <div className="pt-24"> {/* add padding for fixed header */}
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-float">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Learning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Learn Smarter with Synapsee
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform how you learn with AI-powered summaries, interactive mind maps, 
            and podcast-style audio. Your personalized learning companion.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-xl bg-gradient-card backdrop-blur-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Summarization</h3>
            <p className="text-sm text-muted-foreground">
              Upload PDFs and documents to get intelligent, context-aware summaries instantly.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card backdrop-blur-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Mic className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Podcast Audio</h3>
            <p className="text-sm text-muted-foreground">
              Listen to AI-generated conversational audio that makes learning engaging.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card backdrop-blur-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Mind Maps</h3>
            <p className="text-sm text-muted-foreground">
              Visualize concepts and their relationships for better recall and understanding.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gradient-card backdrop-blur-sm border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Notebooks</h3>
            <p className="text-sm text-muted-foreground">
              Organize your learning materials in beautiful, searchable notebooks.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-primary">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to transform your learning?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Join students who are learning faster and smarter with Synapsee.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Start Learning Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      {/* Modern Prepometer section */}
      {/* Prepometer Modal/Drawer */}
      {showPrepometer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-background p-8 rounded-xl shadow-2xl border border-border w-full max-w-2xl flex flex-col gap-6 relative max-h-[90vh]">
            <button
              onClick={() => {
                setShowPrepometer(false);
                setIsSubmitted(false);
                setShowLearningResources(false);
                setShowPracticeQuiz(false);
                setSelectedClass("");
                setSelectedExam("");
              }}
              className="absolute top-3 right-3 rounded-full bg-muted/70 hover:bg-accent/30 w-9 h-9 flex items-center justify-center"
              aria-label="Close"
            >
              <span className="text-lg font-bold">×</span>
            </button>
            {!showLearningResources && !showPracticeQuiz ? (
              <>
                <h3 className="text-2xl font-bold mb-2 text-center">Prepometer</h3>
            <div>
              <label htmlFor="classDropdown" className="block font-medium text-md mb-1">Select Class</label>
              <select
                id="classDropdown"
                className="w-full rounded-lg border border-border p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-muted/20 text-lg ring-1 ring-border/40 hover:ring-primary/50 cursor-pointer transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={isSubmitted}
              >
                <option value="">Choose class</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label htmlFor="examDropdown" className="block font-medium text-md mb-1">Target Exam</label>
              <select
                id="examDropdown"
                className="w-full rounded-lg border border-border p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-muted/20 text-lg ring-1 ring-border/40 hover:ring-primary/50 cursor-pointer transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedExam}
                onChange={e => setSelectedExam(e.target.value)}
                disabled={isSubmitted}
              >
                <option value="">Select your target exam</option>
                <option value="Board Exam">Board Exam</option>
                <option value="NEET">NEET</option>
                <option value="JEE">JEE</option>
                <option value="UPSC">UPSC</option>
                <option value="SSC">SSC</option>
                <option value="CAT">CAT</option>
                <option value="CLAT">CLAT</option>
              </select>
            </div>
                {!isSubmitted ? (
                  <Button
                    onClick={() => {
                      if (selectedClass && selectedExam) {
                        setIsSubmitted(true);
                      }
                    }}
                    disabled={!selectedClass || !selectedExam}
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    Submit
                  </Button>
                ) : (
                  <div className="space-y-4 mt-2">
                    <button
                      onClick={() => {
                        setShowLearningResources(true);
                      }}
                      className="w-full p-4 rounded-lg border border-border bg-gradient-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-3"
                    >
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-lg">Learning Resources</h4>
                        <p className="text-sm text-muted-foreground">Access curated videos, notes, and papers</p>
                      </div>
                    </button>
                <button
                  onClick={() => {
                    const quizzes = getQuizzesForClassExam(selectedClass, selectedExam);
                    if (quizzes && quizzes.chapters.length > 0) {
                      setShowPracticeQuiz(true);
                    } else {
                      toast.info("Practice quizzes coming soon for this combination!");
                    }
                  }}
                  className="w-full p-4 rounded-lg border border-border bg-gradient-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-lg">Practice Quiz</h4>
                    <p className="text-sm text-muted-foreground">Test your knowledge with chapter-wise quizzes</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    // Handle Exam Weightage click
                    console.log("Exam Weightage clicked for", selectedClass, selectedExam);
                  }}
                  className="w-full p-4 rounded-lg border border-border bg-gradient-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-lg">Exam Weightage</h4>
                    <p className="text-sm text-muted-foreground">View subject-wise distribution</p>
                  </div>
                    </button>
                  </div>
                )}
              </>
            ) : showLearningResources ? (
              <div className="max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowLearningResources(false)}
                    className="text-primary hover:underline"
                  >
                    ← Back
                  </button>
                  <h3 className="text-xl font-bold">Learning Resources</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Class {selectedClass} - {selectedExam}
                </p>
                {(() => {
                  const resources = getResourcesForClassExam(selectedClass, selectedExam);
                  if (!resources) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No resources available for this combination.</p>
                        <p className="text-sm mt-2">More resources coming soon!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {/* Notes Section - Organized by Subject and Chapters */}
                      {resources.subjects && Object.keys(resources.subjects).length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Study Notes by Subject
                          </h4>
                          <div className="space-y-6">
                            {Object.entries(resources.subjects).map(([subject, subjectData]) => (
                              <div key={subject} className="border border-border rounded-lg p-4 bg-gradient-card">
                                <h5 className="font-semibold text-base mb-3 text-primary">{subject}</h5>
                                <div className="space-y-2">
                                  {subjectData.chapters.map((chapter) => (
                                    <div
                                      key={chapter.id}
                                      className="p-3 rounded-lg border border-border bg-background/50 hover:shadow-md transition-all"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <h6 className="font-medium mb-1 text-sm">{chapter.title}</h6>
                                          <p className="text-xs text-muted-foreground mb-2">{chapter.description}</p>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddToNotebook(chapter)}
                                          className="flex-shrink-0 text-xs"
                                        >
                                          <BookOpen className="h-3 w-3 mr-1" />
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : resources.notes.length > 0 ? (
                        <div>
                          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Study Notes
                          </h4>
                          <div className="space-y-2">
                            {resources.notes.map((note) => (
                              <div
                                key={note.id}
                                className="p-4 rounded-lg border border-border bg-gradient-card hover:shadow-md transition-all"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <h5 className="font-semibold mb-1">{note.title}</h5>
                                    <p className="text-sm text-muted-foreground mb-2">{note.description}</p>
                                    {note.subject && (
                                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                        {note.subject}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToNotebook(note)}
                                    className="flex-shrink-0"
                                  >
                                    <BookOpen className="h-4 w-4 mr-1" />
                                    Add to Notebook
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Mock Test Section */}
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <span className="text-2xl">📝</span>
                          Mock Test
                        </h4>
                        <div className="p-4 rounded-lg border border-border bg-gradient-card">
                          <p className="text-sm text-muted-foreground mb-3">
                            Generate a comprehensive mock test based on your selected grade and exam pattern.
                          </p>
                          <Button
                            onClick={async () => {
                              try {
                                toast.info(`Generating ${selectedExam} mock test...`);
                                const { data: mockData, error: mockError } = await supabase.functions.invoke("fetch-question-paper", {
                                  body: {
                                    class: selectedClass,
                                    exam: selectedExam,
                                    year: new Date().getFullYear(),
                                    title: `${selectedExam} Mock Test - Class ${selectedClass}`,
                                    isMockTest: true,
                                  },
                                });

                                if (!mockError && mockData?.content) {
                                  // Create a mock test resource
                                  const mockTestResource: Resource = {
                                    id: `mock-test-${Date.now()}`,
                                    title: `${selectedExam} Mock Test - Class ${selectedClass}`,
                                    type: 'pyq',
                                    description: `Comprehensive mock test for ${selectedExam} exam pattern`,
                                    content: mockData.content,
                                    subject: 'Mock Test',
                                  };
                                  await handleAddToNotebook(mockTestResource);
                                  toast.success("Mock test generated and added to notebook!");
                                } else {
                                  toast.error("Failed to generate mock test. Please try again.");
                                }
                              } catch (err) {
                                console.error("Error generating mock test:", err);
                                toast.error("Failed to generate mock test.");
                              }
                            }}
                            className="w-full bg-gradient-primary hover:opacity-90"
                          >
                            <span className="mr-2">🎯</span>
                            Generate Mock Test
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : showPracticeQuiz ? (
              <div className="max-h-[70vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowPracticeQuiz(false)}
                    className="text-primary hover:underline"
                  >
                    ← Back
                  </button>
                  <h3 className="text-xl font-bold">Practice Quiz</h3>
                </div>
                {(() => {
                  const quizzes = getQuizzesForClassExam(selectedClass, selectedExam);
                  if (!quizzes || quizzes.chapters.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No practice quizzes available for this combination.</p>
                        <p className="text-sm mt-2">More quizzes coming soon!</p>
                      </div>
                    );
                  }
                  return (
                    <PracticeQuiz
                      chapters={quizzes.chapters}
                      onClose={() => setShowPracticeQuiz(false)}
                    />
                  );
                })()}
              </div>
            ) : null}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Index;
