import { useState, useEffect } from "react";
import { Plus, Search, LogOut, Loader2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import NotebookCard from "@/components/NotebookCard";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
    </div>
  );
};

export default Notebooks;
