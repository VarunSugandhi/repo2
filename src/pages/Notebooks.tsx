import { useState, useEffect } from "react";
import { Plus, Search, LogOut, Loader2, Sun, Moon, FileText, Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NotebookCard from "@/components/NotebookCard";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { getResourcesForClassExam, type Resource } from "@/data/prepometerResources";
import { getQuizzesForClassExam } from "@/data/prepometerQuizzes";
import PracticeQuiz from "@/components/PracticeQuiz";

interface Notebook {
  id: string;
  title: string;
  created_at: string;
  icon: string;
  color: string;
  sources?: { count: number }[];
}

const Notebooks = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPrepometer, setShowPrepometer] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLearningResources, setShowLearningResources] = useState(false);
  const [showPracticeQuiz, setShowPracticeQuiz] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchNotebooks();
    }
  }, [user]);

  const fetchNotebooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notebooks")
      .select(`
        id,
        title,
        created_at,
        icon,
        color,
        sources(count)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notebooks");
      console.error(error);
    } else {
      setNotebooks(data || []);
    }
    setLoading(false);
  };

  const createNotebook = async () => {
    if (!user) return;

    setCreating(true);
    const { data, error } = await supabase
      .from("notebooks")
      .insert({
        user_id: user.id,
        title: "Untitled Notebook",
        icon: "📓",
        color: "bg-blue-100 dark:bg-blue-950",
      })
      .select()
      .single();

    setCreating(false);

    if (error) {
      toast.error("Failed to create notebook");
      console.error(error);
    } else {
      toast.success("Notebook created!");
      navigate(`/workspace/${data.id}`);
    }
  };

  const filteredNotebooks = notebooks.filter((notebook) =>
    notebook.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToNotebook = async (resource: Resource) => {
    if (!user) {
      toast.error("Please sign in to add resources to notebook");
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

  const chooseColor = (title: string) => {
    const palette = [
      'bg-pink-200',
      'bg-yellow-200',
      'bg-lime-200',
      'bg-sky-200',
      'bg-rose-200',
      'bg-indigo-200',
      'bg-orange-200',
      'bg-teal-200',
      'bg-fuchsia-200',
      'bg-blue-200',
      'bg-green-200',
      'bg-purple-200',
      'bg-cyan-200',
      'bg-red-200'
    ];
    const hash = Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  const localEmojiFallback = (title: string) => {
    const t = title.toLowerCase();
    const candidates: Record<string, string[]> = {
      science: ['🧪','🔬','🧬'],
      math: ['➗','📐','📊'],
      ai: ['🤖','🧠','✨'],
      history: ['🏰','📜','🗺️'],
      language: ['🗣️','📘','📝'],
      art: ['🎨','🖌️','🖼️'],
      code: ['💻','🧩','⚙️'],
      business: ['📈','💼','🏦'],
      health: ['🩺','💊','❤️'],
      python: ['🐍'],
      java: ['☕'],
      javascript: ['🟨'],
      typescript: ['💙'],
      react: ['⚛️'],
      vue: ['🟩'],
      svelte: ['🟧'],
      css: ['🎨'],
      html: ['🌐'],
      node: ['🌱'],
      c: ['🌊'],
      cpp: ['💠'],
      go: ['🐹'],
      rust: ['🦀'],
      dart: ['🎯'],
      sql: ['🗄️'],
      swift: ['🦅'],
      kotlin: ['🎈'],
      php: ['🐘'],
      ruby: ['💎'],
      shell: ['🐚'],
      powershell: ['💻'],
      mongodb: ['🍃'],
      firebase: ['🔥'],
      web: ['🌐'],
      dev: ['👨‍💻','👩‍💻'],
    };
    for (const [k, arr] of Object.entries(candidates)) {
      if (t.includes(k)) return arr[0];
    }
    const pool = ['📘','📗','📕','📙','📔','📝','⭐','🌟','🌱','🧠','🔎','🎯','🧭','🧩'];
    const hash = Array.from(title).reduce((a,c)=>a+c.charCodeAt(0),0);
    return pool[hash % pool.length];
  };

  const handleRename = async (id: string, currentTitle: string) => {
    const newTitle = window.prompt("Rename notebook", currentTitle);
    if (!newTitle || newTitle.trim() === "") return;
    try {
      let emoji = '📓';
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-emoji', { body: { title: newTitle } });
        if (fnError) throw fnError;
        emoji = (fnData?.emoji || localEmojiFallback(newTitle)) as string;
      } catch (invokeErr) {
        console.warn('generate-emoji unavailable, using local fallback');
        emoji = localEmojiFallback(newTitle);
      }
      const color = chooseColor(newTitle);
      const { error } = await supabase.from('notebooks').update({ title: newTitle, icon: emoji, color }).eq('id', id);
      if (error) throw error;
      setNotebooks((prev) => prev.map(n => n.id === id ? { ...n, title: newTitle, icon: emoji, color } : n));
      toast.success('Notebook renamed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to rename');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete notebook "${title}"? This will remove its content.`)) return;
    try {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);
      if (error) throw error;
      setNotebooks((prev) => prev.filter(n => n.id !== id));
      toast.success('Notebook deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete');
    }
  };

  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  const toggleTheme = () => {
    if (typeof window === "undefined") return;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1
            className="text-4xl font-bold tracking-tight text-center"
            style={{
              fontFamily: `Gill Sans, GillSans, 'Gill Sans MT', Calibri, sans-serif`,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: 'var(--foreground)',
            }}
          >
            SYNAPSEE
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrepometer(true)}
              className="gap-2 mr-1"
            >
              <span className="text-2xl">📈</span>
              Prepometer
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className={
                    `rounded-full p-2 transition-colors flex items-center justify-center hover:bg-accent/50 focus:outline-none ` +
                    (isDark ? "bg-muted" : "bg-accent")
                  }
                  aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
                >
                  {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Switch to {isDark ? "light" : "dark"} mode
              </TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        <div className="mb-4 flex gap-4 justify-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">Recent notebooks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(() => {
              const palette = [
                'bg-pink-200', 'bg-yellow-200', 'bg-lime-200', 'bg-sky-200', 'bg-rose-200',
                'bg-indigo-200', 'bg-orange-200', 'bg-teal-200', 'bg-fuchsia-200', 'bg-blue-200',
                'bg-green-200', 'bg-purple-200', 'bg-cyan-200', 'bg-red-200'
              ];
              // Create notebook card (always transparent white)
              const cards = [
                <button
                  key="_create_notebook"
                  className={
                    `group rounded-2xl border-0 shadow-sm transition-all duration-300 flex flex-col items-center justify-center gap-3 disabled:opacity-50 text-card-foreground cursor-pointer min-w-[300px] min-h-[220px] bg-white/60 hover:bg-white/90 relative overflow-hidden`
                  }
                  style={{ minWidth: 300, minHeight: 220 }}
                  onClick={createNotebook}
                  disabled={creating}
                >
                  {/* Shine effect overlay */}
                  <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-300 bg-gradient-to-r from-white/20 via-white/80 to-white/20 animate-shimmer" style={{zIndex:1}}></span>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors" style={{zIndex:2}}>
                    {creating ? (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    ) : (
                      <Plus className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors" style={{zIndex:2}}>
                    {creating ? "Creating..." : "Create new notebook"}
                  </span>
                </button>
              ];
              filteredNotebooks.forEach((notebook, i) => {
                const colorIdx = (i + 1) % palette.length;
                cards.push(
                  <div key={notebook.id} className={`min-w-[300px] min-h-[220px] relative group overflow-hidden`}>
                    {/* Shine overlay for hover */}
                    <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-80 transition-opacity duration-300 bg-gradient-to-r from-white/20 via-white/60 to-white/20 animate-shimmer z-20"></span>
                    <NotebookCard
                      id={notebook.id}
                      title={notebook.title}
                      date={new Date(notebook.created_at).toLocaleDateString()}
                      sources={notebook.sources?.[0]?.count || 0}
                      color={`${palette[colorIdx]} group-hover:bg-white/40`}
                      icon={notebook.icon}
                      onRename={handleRename}
                      onDelete={handleDelete}
                    />
                  </div>
                );
              });
              return cards;
            })()}
          </div>
        </div>
      </div>
      {/* Prepometer Modal */}
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
                        <p>No quizzes available for this combination.</p>
                        <p className="text-sm mt-2">More quizzes coming soon!</p>
                      </div>
                    );
                  }

                  return <PracticeQuiz quizzes={quizzes} />;
                })()}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notebooks;
