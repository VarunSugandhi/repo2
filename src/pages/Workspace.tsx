import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Upload, Send, Loader2, ArrowLeft, ExternalLink, FileUp, FileDown, CheckSquare, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MindMapVisualization from "@/components/MindMapVisualization";
import MindMapFlow from "@/components/MindMapFlow";
import JSZip from "jszip";
import jsPDF from "jspdf";

interface Source {
  id: string;
  title: string;
  type: string;
  content: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ResearchLink {
  title: string;
  description: string;
  url: string;
  source: string;
}

const Workspace = () => {
  const { notebookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notebook, setNotebook] = useState<any>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [researchLinks, setResearchLinks] = useState<ResearchLink[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<Set<number>>(new Set());
  const [audioOverview, setAudioOverview] = useState<{dialogue: string; audioSegments: any[]; providerError?: string | null} | null>(null);
  const [generatingSegments, setGeneratingSegments] = useState<Set<number>>(new Set());
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [mindMapSvgEl, setMindMapSvgEl] = useState<SVGSVGElement | null>(null);
  const [report, setReport] = useState<string>("");
  const [activeTab, setActiveTab] = useState("summary");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const [isSpeakingAll, setIsSpeakingAll] = useState(false);
  const [isSpeakingPaused, setIsSpeakingPaused] = useState(false);
  const speakingIndexRef = useRef<number>(-1);
  const speakingActiveRef = useRef<boolean>(false);
  const [combinedAudioUrl, setCombinedAudioUrl] = useState<string | null>(null);
  const [combining, setCombining] = useState(false);
  const [selectedKeyPoint, setSelectedKeyPoint] = useState<string | null>(null);

  // Inline rename support for notebook header
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingTitle) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          titleInputRef.current?.focus();
          titleInputRef.current?.select();
        });
      });
      return () => cancelAnimationFrame(id);
    }
  }, [renamingTitle]);

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

  const commitTitleRename = async () => {
    const newTitle = tempTitle.trim();
    setRenamingTitle(false);
    if (!notebook || !newTitle || newTitle === notebook.title) return;
    try {
      let emoji = notebook.icon || '📓';
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('generate-emoji', { body: { title: newTitle } });
        if (fnError) throw fnError;
        emoji = (fnData?.emoji || localEmojiFallback(newTitle)) as string;
      } catch (invokeErr) {
        emoji = localEmojiFallback(newTitle);
      }
      const color = chooseColor(newTitle);
      const { error } = await supabase.from('notebooks').update({ title: newTitle, icon: emoji, color }).eq('id', notebook.id);
      if (error) throw error;
      setNotebook((prev: any) => ({ ...prev, title: newTitle, icon: emoji, color }));
      toast.success('Notebook renamed');
    } catch (e) {
      console.error(e);
      toast.error('Failed to rename notebook');
    }
  };

  // Extract readable messages from Supabase Functions errors
  const getFunctionsErrorMessage = async (err: unknown): Promise<string> => {
    try {
      // @ts-ignore
      const ctx = err?.context;
      const res = ctx?.response as Response | undefined;
      if (res) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          return json.error || json.message || res.statusText || 'Unknown error';
        } catch {
          return text || res.statusText || 'Unknown error';
        }
      }
      return err instanceof Error ? err.message : 'Unknown error';
    } catch {
      return err instanceof Error ? err.message : 'Unknown error';
    }
  };

  useEffect(() => {
    if (notebookId) {
      fetchNotebook();
      fetchSources();
    }
  }, [notebookId]);

  // Fetch research links when notebook data is available
  useEffect(() => {
    if (notebook) {
      fetchResearchLinks();
    }
  }, [notebook]);

  // Load latest summary and chat history for better resume experience
  useEffect(() => {
    if (notebookId) {
      fetchLatestSummary();
      fetchChatHistory();
    }
  }, [notebookId]);

  const fetchLatestSummary = async () => {
    const { data, error } = await supabase
      .from("summaries")
      .select("content, key_points")
      .eq("notebook_id", notebookId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setSummary(data.content);
      const maybeArray = data.key_points as unknown;
      if (Array.isArray(maybeArray)) {
        setKeyPoints(maybeArray as string[]);
      } else if (maybeArray) {
        try {
          // In case key_points is a JSON object/string of array
          const parsed = typeof maybeArray === 'string' ? JSON.parse(maybeArray) : maybeArray;
          setKeyPoints(Array.isArray(parsed) ? (parsed as string[]) : []);
        } catch {
          setKeyPoints([]);
        }
      }
    }
  };

  const fetchChatHistory = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("notebook_id", notebookId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const history: ChatMessage[] = data.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));
      setChatMessages(history);
    }
  };

  const fetchNotebook = async () => {
    const { data, error } = await supabase
      .from("notebooks")
      .select("*")
      .eq("id", notebookId)
      .single();

    if (error) {
      toast.error("Failed to load notebook");
      navigate("/notebooks");
    } else {
      setNotebook(data);
    }
    setLoading(false);
  };

  const fetchSources = async () => {
    const { data, error } = await supabase
      .from("sources")
      .select("*")
      .eq("notebook_id", notebookId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSources(data);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.type !== 'application/pdf') {
      toast.error("Please upload a PDF file");
      return;
    }

    setGenerating(true);
    toast.info("Uploading PDF and extracting text...");

    try {
      // 1) Upload to Supabase Storage to persist the file
      const storagePath = `${user.id}/${notebookId}/${Date.now()}-${file.name}`;
      const uploadRes = await supabase.storage
        .from('documents')
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (uploadRes.error) {
        throw new Error(`Storage upload failed: ${uploadRes.error.message}`);
      }

      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke("extract-pdf-text", {
        body: formData,
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Save the extracted content as a source
      const { data: sourceData, error: sourceError } = await supabase
        .from("sources")
        .insert({
          notebook_id: notebookId,
          title: file.name,
          type: "pdf",
          content: data.text,
          file_path: uploadRes.data?.path || null,
          file_size: file.size,
        })
        .select()
        .single();

      if (sourceError) {
        toast.error("Failed to save PDF source");
        return;
      }

      setSources([sourceData, ...sources]);
      toast.success("PDF uploaded and processed!");
      await generateSummary(data.text);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to process PDF: ${message}`);
    } finally {
      setGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddTextSource = async () => {
    if (!textInput.trim() || !user) return;

    const { data, error } = await supabase
      .from("sources")
      .insert({
        notebook_id: notebookId,
        title: textInput.substring(0, 50) + "...",
        type: "text",
        content: textInput,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add source");
    } else {
      setSources([data, ...sources]);
      setTextInput("");
      toast.success("Source added!");
      await generateSummary(textInput);
    }
  };

  const generateSummary = async (content: string) => {
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { text: content, mode: "standard" },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSummary(data.summary);
      setKeyPoints(data.keyPoints || []);

      // Save summary to database
      await supabase.from("summaries").insert({
        notebook_id: notebookId,
        title: "AI Summary",
        content: data.summary,
        key_points: data.keyPoints,
      });

      toast.success("Summary generated!");

      // Fetch YouTube learning links based on extracted headings/subheadings
      try {
        const yt = await supabase.functions.invoke("fetch-research-links", { body: { summary: data.summary } });
        if (!yt.error && yt.data?.links) {
          const processed = prioritizeYouTubeLinks(yt.data.links, data.keyPoints || []);
          setResearchLinks(processed);
        }
      } catch {}
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate summary: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (!summary && selectedLinks.size === 0) {
      toast.error("Please generate a summary or select research links first");
      return;
    }

    setGenerating(true);
    try {
      // Use selected research links or summary
      const content = selectedLinks.size > 0
        ? researchLinks
            .filter((_, idx) => selectedLinks.has(idx))
            .map(link => `${link.title}: ${link.description}`)
            .join('\n\n')
        : summary;

      const { data, error } = await supabase.functions.invoke("generate-mind-map", {
        body: { summary: content, notebookId },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMindMapData(data.mindMapData);

      // Save mind map to database
      await supabase.from("mind_maps").insert({
        notebook_id: notebookId,
        title: "AI Mind Map",
        data: data.mindMapData,
      });

      toast.success("Mind map generated!");
      setActiveTab("mindmap");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate mind map: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!summary) {
      toast.error("Please generate a summary first");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { 
          summary, 
          researchLinks,
          topic: notebook?.title 
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setReport(data.report);
      toast.success("Report generated!");
      setActiveTab("report");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate report: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleLinkSelection = (idx: number) => {
    const newSelected = new Set(selectedLinks);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedLinks(newSelected);
  };

  const handleGenerateAudioOverview = async () => {
    if (!summary) {
      toast.error("Please generate a summary first");
      return;
    }

    setGenerating(true);
    setAudioOverview(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-audio-overview", {
        body: { summary },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAudioOverview({
        dialogue: data.dialogue,
        audioSegments: data.audioSegments || [],
        providerError: data.providerError || null,
      });
      setIsPlayingAll(false);
      setCurrentSegmentIndex(-1);

      const failedCount = (data.audioSegments || []).filter((s: any) => s.status === 'failed').length;
      const successCount = (data.audioSegments || []).filter((s: any) => s.status === 'success').length;

      if (failedCount > 0 && successCount > 0) {
        toast.warning(`Generated ${successCount} segments, ${failedCount} failed (you can retry them)`);
      } else if (failedCount > 0) {
        toast.warning("All segments failed to generate. You can retry them individually.");
      } else if (data.providerError) {
        toast.warning("Audio provider limited: showing transcript only.");
      } else {
        toast.success("Audio overview generated!");
      }
      setActiveTab("audio");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to generate audio overview: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayAll = () => {
    if (!audioOverview?.audioSegments?.length) return;
    setIsPlayingAll(true);
    setCurrentSegmentIndex(0);
    setTimeout(() => {
      const first = audioRefs.current[0];
      first?.play().catch(() => {});
    }, 0);
  };

  const handleStopAll = () => {
    setIsPlayingAll(false);
    const arr = audioRefs.current;
    arr.forEach(a => a?.pause());
    setCurrentSegmentIndex(-1);
  };

  const handleEnded = (idx: number) => {
    if (!isPlayingAll) return;
    const next = idx + 1;
    if (!audioOverview?.audioSegments) return;
    if (next < audioOverview.audioSegments.length) {
      setCurrentSegmentIndex(next);
      const el = audioRefs.current[next];
      el?.play().catch(() => {});
    } else {
      setIsPlayingAll(false);
      setCurrentSegmentIndex(-1);
    }
  };

  const retryAllFailed = async () => {
    if (!audioOverview?.audioSegments) return;
    const indices = audioOverview.audioSegments
      .map((s: any, i: number) => (s.status === 'failed' ? i : -1))
      .filter((i: number) => i >= 0);
    if (indices.length === 0) return toast.info("No failed segments to retry");

    for (const idx of indices) {
      setGeneratingSegments(prev => new Set(prev).add(idx));
      const seg = audioOverview.audioSegments[idx];
      try {
        const { data, error } = await supabase.functions.invoke("generate-single-segment", {
          body: { speaker: seg.speaker, text: seg.text },
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
        setAudioOverview(prev => {
          if (!prev) return prev;
          const newSegments = [...prev.audioSegments];
          newSegments[idx] = { ...seg, audio: data.audio, status: 'success' };
          return { ...prev, audioSegments: newSegments };
        });
      } catch (e) {
        console.error(e);
        const msg = await getFunctionsErrorMessage(e);
        toast.error(`Retry failed for segment ${idx + 1}: ${msg}`);
        // Fallback: speak the segment via browser TTS so user can still listen
        speakText(seg?.text || '', (seg?.speaker as 'AURA' | 'NEO') || 'AURA');
      } finally {
        setGeneratingSegments(prev => {
          const ns = new Set(prev);
          ns.delete(idx);
          return ns;
        });
      }
    }
    toast.success("Retried failed segments");
  };

  const downloadReportAsPDF = async () => {
    const title = (notebook?.title || 'report').replace(/\s+/g, '-');
    const contentLines = (report || '').split('\n').map(l => l.trim());

    // Basic markdown cleanup for paragraphs and headings
    const paragraphs: { type: 'h1' | 'p'; text: string }[] = [];
    contentLines.forEach((line) => {
      if (!line) return;
      if (/^#\s+/.test(line)) {
        paragraphs.push({ type: 'h1', text: line.replace(/^#\s+/, '') });
      } else {
        const t = line
          .replace(/^[-*]\s+/, '')
          .replace(/^\d+\.\s+/, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/`([^`]+)`/g, '$1');
        paragraphs.push({ type: 'p', text: t });
      }
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text((notebook?.title || 'Report'), margin, y);
    y += 24;

    paragraphs.forEach((p) => {
      if (p.type === 'h1') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
      }
      const lines = doc.splitTextToSize(p.text, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 16;
      });
      y += p.type === 'h1' ? 6 : 4;
    });

    doc.save(`${title}.pdf`);
    toast.success('Report downloaded as PDF');
  };

  const downloadSegment = (base64: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = `data:audio/mpeg;base64,${base64}`;
      link.download = filename;
      link.click();
    } catch {}
  };

  // Browser speech synthesis fallback when provider quota is exceeded
  const ensureVoicesLoaded = (): Promise<void> => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) return resolve();
      const handler = () => {
        const vs = window.speechSynthesis.getVoices();
        if (vs && vs.length > 0) {
          window.speechSynthesis.onvoiceschanged = null as any;
          resolve();
        }
      };
      window.speechSynthesis.onvoiceschanged = handler;
      // safety timeout
      setTimeout(() => resolve(), 800);
    });
  };

  const pickVoice = (preferred: 'AURA' | 'NEO') => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;
    const female = voices.find(v => /female|woman|samantha|victoria/i.test(v.name));
    const male = voices.find(v => /male|man|daniel|alex|fred/i.test(v.name));
    return preferred === 'AURA' ? (female || voices[0]) : (male || voices[0]);
  };

  const speakText = (text: string, speaker: 'AURA' | 'NEO') => {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(speaker);
    if (voice) utter.voice = voice;
    utter.rate = 1.0;
    utter.pitch = speaker === 'AURA' ? 1.05 : 0.95;
    window.speechSynthesis.speak(utter);
  };

  const continueSpeakFromCurrent = async () => {
    if (!audioOverview?.dialogue) return;
    await ensureVoicesLoaded();
    const lines = audioOverview.dialogue.split('\n').filter(Boolean);
    const speakNext = () => {
      if (!speakingActiveRef.current || speakingIndexRef.current >= lines.length) {
        setIsSpeakingAll(false);
        setIsSpeakingPaused(false);
        speakingIndexRef.current = -1;
        return;
      }
      const line = lines[speakingIndexRef.current];
      let speaker: 'AURA' | 'NEO' = /NEO:/i.test(line) ? 'NEO' : 'AURA';
      const text = line.replace(/^(🎙️\s*)?AURA:\s*/i, '').replace(/^(🤖\s*)?NEO:\s*/i, '');
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(speaker);
      if (voice) utter.voice = voice;
      utter.rate = 1.0;
      utter.pitch = speaker === 'AURA' ? 1.05 : 0.95;
      utter.onend = () => { speakingIndexRef.current += 1; speakNext(); };
      utter.onerror = () => { speakingIndexRef.current += 1; speakNext(); };
      window.speechSynthesis.speak(utter);
    };
    speakNext();
  };

  const speakAll = async () => {
    if (!audioOverview?.dialogue) return;
    if (!('speechSynthesis' in window)) {
      toast.error('Browser speech synthesis not supported');
      return;
    }
    // Clear any queued utterances before starting fresh
    try { window.speechSynthesis.cancel(); } catch {}
    setIsSpeakingAll(true);
    setIsSpeakingPaused(false);
    speakingActiveRef.current = true;
    speakingIndexRef.current = 0;
    await continueSpeakFromCurrent();
  };

  const pauseSpeaking = () => {
    if (!('speechSynthesis' in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsSpeakingPaused(true);
      speakingActiveRef.current = true; // still active, just paused
    }
  };

  const resumeSpeaking = () => {
    if (!('speechSynthesis' in window)) return;
    // Case 1: We are truly paused mid-utterance → just resume
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsSpeakingPaused(false);
      setIsSpeakingAll(true);
      speakingActiveRef.current = true;
      return;
    }
    // Case 2: Not speaking (ended while paused or after a pause), but we have a position → continue from current
    if (!window.speechSynthesis.speaking && speakingIndexRef.current >= 0) {
      speakingActiveRef.current = true;
      setIsSpeakingPaused(false);
      setIsSpeakingAll(true);
      continueSpeakFromCurrent();
      return;
    }
    // Otherwise: already speaking or nothing to resume
  };

  // Utilities to combine multiple base64 mp3 segments into a single WAV we can play/download
  const base64ToArrayBuffer = (b64: string) => {
    const binary_string = atob(b64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
    return bytes.buffer;
  };

  const encodeWAV = (audioBuffer: AudioBuffer) => {
    const numOfChan = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    let offset = 0;
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + audioBuffer.length * numOfChan * 2, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // PCM chunk size
    view.setUint16(offset, 1, true); offset += 2; // audio format PCM
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4; // byte rate
    view.setUint16(offset, numOfChan * 2, true); offset += 2; // block align
    view.setUint16(offset, 16, true); offset += 2; // bits per sample
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, audioBuffer.length * numOfChan * 2, true); offset += 4;

    // interleave & write PCM
    const channels: Float32Array[] = [];
    for (let c = 0; c < numOfChan; c++) channels.push(audioBuffer.getChannelData(c));
    let sampleIndex = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let c = 0; c < numOfChan; c++) {
        let s = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      }
      sampleIndex++;
    }
    return new Blob([view], { type: 'audio/wav' });
  };

  const combineSegmentsToSingleAudio = async (segments?: any[]) => {
    const list = segments || audioOverview?.audioSegments || [];
    if (!list.length) return;
    const playable = list.filter((s: any) => s.status === 'success' && s.audio);
    if (playable.length === 0) {
      toast.error('No generated audio to combine. Try Speak All (Browser).');
      return;
    }
    try {
      setCombining(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decoded: AudioBuffer[] = [];
      for (const seg of playable) {
        const buf = base64ToArrayBuffer(seg.audio);
        const ab = await audioCtx.decodeAudioData(buf.slice(0));
        decoded.push(ab);
      }
      const sampleRate = decoded[0].sampleRate;
      const channels = Math.max(...decoded.map(b => b.numberOfChannels));
      const totalLength = decoded.reduce((sum, b) => sum + b.length, 0);
      const output = audioCtx.createBuffer(channels, totalLength, sampleRate);
      let offset = 0;
      decoded.forEach(b => {
        for (let c = 0; c < channels; c++) {
          const src = b.getChannelData(Math.min(c, b.numberOfChannels - 1));
          output.getChannelData(c).set(src, offset);
        }
        offset += b.length;
      });
      const wavBlob = encodeWAV(output);
      const url = URL.createObjectURL(wavBlob);
      setCombinedAudioUrl(url);
      toast.success('Combined podcast ready');
    } catch (e) {
      console.error(e);
      toast.error('Failed to combine audio. Try Speak All (Browser).');
    } finally {
      setCombining(false);
    }
  };

  // Auto-combine when segments arrive
  useEffect(() => {
    if (audioOverview?.audioSegments?.length) {
      combineSegmentsToSingleAudio(audioOverview.audioSegments);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioOverview?.audioSegments]);

  const handleSendMessage = async () => {
    if (!message.trim() || chatLoading) return;

    const userMessage: ChatMessage = { role: "user", content: message };
    setChatMessages(prev => [...prev, userMessage]);
    setMessage("");
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-with-document", {
        body: { 
          message: userMessage.content,
          notebookId,
          conversationHistory: chatMessages
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: data.reply };
      setChatMessages(prev => [...prev, assistantMessage]);

      // Save both messages to database
      await supabase.from("chat_messages").insert([
        { notebook_id: notebookId, role: "user", content: userMessage.content },
        { notebook_id: notebookId, role: "assistant", content: assistantMessage.content },
      ]);
    } catch (error) {
      console.error(error);
      const message = await getFunctionsErrorMessage(error);
      toast.error(`Failed to send message: ${message}`);
      // Optimistic fallback assistant message indicating failure
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that request." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchResearchLinks = async () => {
    if (!notebook) return;

    try {
      const { data, error } = await supabase.functions.invoke("fetch-research-links", {
        body: { summary },
      });

      if (error) throw error;
      if (data?.links) {
        const processed = prioritizeYouTubeLinks(data.links, keyPoints);
        setResearchLinks(processed);
      }
    } catch (error) {
      const msg = await getFunctionsErrorMessage(error);
      console.warn("Failed to fetch research links:", msg);
      // Local fallback: YouTube first, then other research links
      const yt = buildYouTubeFallback(keyPoints);
      const others = buildOtherResearchFallback(keyPoints);
      setResearchLinks([...yt, ...others]);
    }
  };

  const isYouTubeUrl = (url?: string) => !!url && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

  const buildYouTubeFallback = (points: string[]) => {
    const topics = (points && points.length > 0 ? points.slice(0, 5) : ['learning']).map(t => t.replace(/\s+/g, ' ').trim());
    return topics.map((t) => ({
      title: `Lecture: ${t}`,
      description: `YouTube search results for ${t}`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} lecture`)}`,
      source: 'YouTube',
      heading: t,
      subheading: undefined,
    }));
  };

  const buildOtherResearchFallback = (points: string[]) => {
    const topics = (points && points.length > 0 ? points.slice(0, 5) : ['learning']).map(t => t.replace(/\s+/g, ' ').trim());
    const items: any[] = [];
    for (const t of topics) {
      items.push({
        title: `Overview: ${t} – Wikipedia`,
        description: `Wikipedia overview for ${t}`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(t)}`,
        source: 'Wikipedia',
        heading: t,
        subheading: undefined,
      });
      items.push({
        title: `Research: ${t} – Google Scholar`,
        description: `Scholarly articles about ${t}`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(t)}`,
        source: 'Google Scholar',
        heading: t,
        subheading: undefined,
      });
      items.push({
        title: `Articles: ${t} – Google`,
        description: `Web results for ${t}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(t)}`,
        source: 'Web',
        heading: t,
        subheading: undefined,
      });
    }
    return items;
  };

  const prioritizeYouTubeLinks = (links: any[], points: string[] = []) => {
    const withFlags = links.map(l => ({ ...l, __yt: isYouTubeUrl(l?.url) ? 1 : 0 }));
    withFlags.sort((a, b) => b.__yt - a.__yt);
    const hasYouTube = withFlags.some(l => l.__yt === 1);
    if (!hasYouTube) {
      return [...buildYouTubeFallback(points), ...withFlags];
    }
    return withFlags;
  };

  // Derive a main heading from the summary (prefer markdown H1, else first non-empty line)
  const getSummaryMainHeading = (text: string, fallback?: string) => {
    if (!text) return fallback || '';
    const lines = text.split('\n').map(l => l.trim());
    const h1 = lines.find(l => /^#\s+/.test(l));
    if (h1) return h1.replace(/^#\s+/, '').trim();
    const first = lines.find(l => l.length > 0);
    return (first || fallback || '').replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sources Sidebar */}
      <div className="w-80 border-r border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/notebooks")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notebooks
          </Button>
          <h2 className="font-semibold mb-4">Sources</h2>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-4">
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
                disabled={generating}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Upload PDF
              </Button>
              <Textarea
                placeholder="Paste your text or notes here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleAddTextSource}
                className="w-full bg-gradient-primary"
                disabled={!textInput.trim() || generating}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Text & Generate Summary
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Added Sources ({sources.length})</p>
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm line-clamp-2">{source.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{notebook?.icon}</span>
            </div>
            <div className="flex-1">
              {renamingTitle ? (
                <input
                  ref={titleInputRef}
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={commitTitleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitleRename();
                    if (e.key === 'Escape') { setRenamingTitle(false); setTempTitle(notebook?.title || ''); }
                  }}
                  className="text-xl font-semibold mb-1 bg-transparent border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <h1
                  className="text-xl font-semibold mb-1 hover:underline underline-offset-4 cursor-text"
                  onClick={() => { setTempTitle(notebook?.title || ''); setRenamingTitle(true); }}
                >
                  {notebook?.title}
                </h1>
              )}
              <p className="text-sm text-muted-foreground">{sources.length} sources</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {generating && (
              <div className="flex items-center justify-center gap-2 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Generating AI content...</span>
              </div>
            )}

            {(summary || audioOverview || mindMapData || report) && !generating && (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="summary">📝 Summary</TabsTrigger>
                  <TabsTrigger value="report" disabled={!report}>📄 Report</TabsTrigger>
                  <TabsTrigger value="audio" disabled={!audioOverview}>🎙️ Podcast</TabsTrigger>
                  <TabsTrigger value="mindmap" disabled={!mindMapData}>🗺️ Mind Map</TabsTrigger>
                </TabsList>

                <TabsContent value="summary">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={!summary}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerateMindMap} disabled={!summary && selectedLinks.size === 0}>
                        🧠 Generate Mind Map
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleGenerateAudioOverview} disabled={!summary}>
                        🎧 Generate Podcast
                      </Button>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                      <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-4 text-foreground">
                          {(() => {
                            const knownPhrases = [
                              'gen ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'supply chain', 'blockchain', 'big data', 'data science', 'natural language', 'computer vision', 'internet of things', 'iot', 'cloud computing', 'edge computing', 'cyber security', 'quantum computing'
                            ];
                            // Stopwords—expanded
                            const stopwords = new Set([
                              'the','a','an','to','and','or','of','in','for','on','this','that','is','be','are','being','by','with','at','from','as','was','were','it','which','if','not','but','has','have','had','can','will','would','should','may','might','could','do','does','done','about','into','been','was','their','its','also','we','i','you','our','they','he','she','them','his','her','us','so','than','these','those','such','more','most','some','other','all','over','new','used','using','use','because','among','between','through','per','each','within','after','before','one','two','three','first','second','third','file','document','prompt','user','say','output','extracted','content','summary','main','provide','please','introduction','extract','v1.0']
                            );
                            let text = summary || '';
                            // Try: first line/heading that isn't generic
                            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                            for (let line of lines) {
                              const simple = line.replace(/^[\*•#\-.\s]+/, '').replace(/[^\w\s%]/g, '').trim().toLowerCase();
                              if (!simple) continue;
                              // look for phrase match
                              const matchedPhrase = knownPhrases.find(phrase => simple.includes(phrase));
                              if (matchedPhrase) return matchedPhrase;
                              // Heuristic: should be 3-8 words, not all caps, not all stopwords, not "introduction" etc
                              const ws = line.split(/\s+/).filter(w => !!w);
                              if (ws.length < 3 || ws.length > 8) continue;
                              if (ws.every(w => stopwords.has(w.toLowerCase()))) continue;
                              if (/^[A-Z \-]+$/.test(line)) continue; // skip ALLCAPS
                              if (['introduction','extract','summary','content','document'].includes(simple)) continue;
                              return ws.map(w => w.replace(/[^a-zA-Z0-9]/g, '')).join(' ');
                            }
                            // Fallback to previous keyword freq extraction:
                            text = text.replace(/[\*•#>\-_`~\[\](){}:\/"',.?!;0-9]/g,' ').toLowerCase();
                            const freq = {};
                            text.split(/\s+/).forEach(w => {
                              if (w.length < 2) return;
                              if (stopwords.has(w)) return;
                              freq[w] = (freq[w] || 0) + 1;
                            });
                            const sortedWords = Object.keys(freq)
                              .sort((a,b) => freq[b]-freq[a] || text.indexOf(a) - text.indexOf(b));
                            let topic = '';
                            if (text.includes('gen ai')) { topic = 'gen ai'; }
                            else if (text.includes('artificial intelligence')) { topic = 'artificial intelligence'; }
                            else if (sortedWords.length) { topic = sortedWords.slice(0,3).join(' '); }
                            else { topic = (getSummaryMainHeading(summary, notebook?.title)||'').split(/\s+/).slice(0,3).join(' '); }
                            return topic.trim();
                          })()}
                        </h1>
                        <div className="text-lg leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                            }}
                          >
                            {summary}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {keyPoints.length > 0 && (
                        <div className="bg-accent/20 rounded-lg p-6 border border-border">
                          <h3 className="text-xl font-semibold mb-4">📊 Key Points</h3>
                          <ul className="space-y-2">
                            {keyPoints.map((point, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 cursor-pointer"
                                onClick={() => setSelectedKeyPoint(point)}
                              >
                                <span>{point.replace(/^[*•.-]+\s*/, '').replace(/[*•.-]+$/, '').trim()}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="report">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-semibold">📄 Research Report</h2>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={downloadReportAsPDF}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none bg-card border border-border rounded-lg p-8">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        }}
                      >
                        {report}
                      </ReactMarkdown>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audio">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-6">🎙️ AI Podcast: AURA × NEO</h2>
                    
                    <div className="flex flex-wrap gap-4 mb-6 items-center">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-sm font-medium">AURA - Curious Host</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-lg">
                        <div className="h-3 w-3 rounded-full bg-secondary animate-pulse"></div>
                        <span className="text-sm font-medium">NEO - Expert Analyst</span>
                      </div>
                      <div className="ml-auto flex gap-2">
                        {(() => {
                          const hasSuccess = !!audioOverview?.audioSegments?.some((s: any) => s.status === 'success');
                          const quota = audioOverview?.providerError === 'quota_exceeded';
                          const ttsOk = hasSuccess && !quota;
                          if (ttsOk) {
                            return (
                              <>
                                <Button size="sm" variant="outline" onClick={handlePlayAll} disabled={!audioOverview?.audioSegments?.length || isPlayingAll} className="h-full w-full rounded-[inherit] max-w-[110px]">
                                  ▶️ Play All
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleStopAll} disabled={!isPlayingAll} className="h-full w-full rounded-[inherit] max-w-[110px]">
                                  ⏹ Stop
                                </Button>
                              </>
                            );
                          }
                          return (
                            <>
                              <Button size="sm" variant="outline" onClick={speakAll} disabled={isSpeakingAll && !isSpeakingPaused} className="h-full w-full rounded-[inherit] max-w-[170px]">
                                🔊 Speak All (Browser)
                              </Button>
                              <Button size="sm" variant="outline" onClick={pauseSpeaking} disabled={!isSpeakingAll || isSpeakingPaused} className="h-full w-full rounded-[inherit] max-w-[130px]">
                                ⏸ Stop Speak
                              </Button>
                              <Button size="sm" variant="outline" onClick={resumeSpeaking} disabled={!isSpeakingPaused} className="h-full w-full rounded-[inherit] max-w-[140px]">
                                ▶️ Resume Speak
                              </Button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {audioOverview?.audioSegments && audioOverview.audioSegments.length > 0 && combinedAudioUrl && (
                      <div className="mb-6 bg-muted/30 rounded-lg p-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Volume2 className="h-5 w-5" />
                          Audio Podcast
                        </h3>
                        <audio controls className="w-full" src={combinedAudioUrl} />
                      </div>
                    )}

                    {audioOverview?.dialogue && (
                      <div className="bg-gradient-to-br from-card to-muted/30 rounded-lg p-6 border border-border">
                        <h3 className="font-semibold text-lg mb-4">Transcript</h3>
                        <div className="space-y-4">
                          {audioOverview.dialogue.split('\n').map((line, idx) => {
                            if (line.includes('AURA:')) {
                              return (
                                <div key={idx} className="flex gap-3 items-start">
                                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    🎙️
                                  </div>
                                  <div className="flex-1 bg-primary/5 rounded-lg p-4">
                                    <p className="font-medium text-primary mb-1">AURA</p>
                                    <p>{line.replace(/🎙️\s*AURA:\s*/i, '')}</p>
                                  </div>
                                </div>
                              );
                            } else if (line.includes('NEO:')) {
                              return (
                                <div key={idx} className="flex gap-3 items-start">
                                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                    🤖
                                  </div>
                                  <div className="flex-1 bg-secondary/5 rounded-lg p-4">
                                    <p className="font-medium text-secondary mb-1">NEO</p>
                                    <p>{line.replace(/🤖\s*NEO:\s*/i, '')}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="mindmap">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold mb-4">🗺️ Interactive Mind Map</h2>
                    {mindMapData && mindMapSvgEl && (
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!mindMapSvgEl) return;
                            const serializer = new XMLSerializer();
                            const source = serializer.serializeToString(mindMapSvgEl);
                            const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${(notebook?.title || 'mindmap').replace(/\s+/g, '-')}.svg`;
                            a.click();
                            URL.revokeObjectURL(url);
                            toast.success('SVG downloaded');
                          }}
                        >
                          Download SVG
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!mindMapSvgEl) return;
                            const serializer = new XMLSerializer();
                            const svgString = serializer.serializeToString(mindMapSvgEl);
                            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                            const url = URL.createObjectURL(svgBlob);
                            const img = new Image();
                            const canvas = document.createElement('canvas');
                            const rect = mindMapSvgEl.viewBox.baseVal;
                            const width = rect && rect.width ? rect.width : mindMapSvgEl.clientWidth || 1200;
                            const height = rect && rect.height ? rect.height : mindMapSvgEl.clientHeight || 600;
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) return;
                            await new Promise<void>((resolve) => {
                              img.onload = () => {
                                ctx.fillStyle = '#111318';
                                ctx.fillRect(0, 0, width, height);
                                ctx.drawImage(img, 0, 0, width, height);
                                URL.revokeObjectURL(url);
                                resolve();
                              };
                              img.src = url;
                            });
                            canvas.toBlob((blob) => {
                              if (!blob) return;
                              const a = document.createElement('a');
                              const pngUrl = URL.createObjectURL(blob);
                              a.href = pngUrl;
                              a.download = `${(notebook?.title || 'mindmap').replace(/\s+/g, '-')}.png`;
                              a.click();
                              URL.revokeObjectURL(pngUrl);
                              toast.success('PNG downloaded');
                            }, 'image/png');
                          }}
                        >
                          Download PNG
                        </Button>
                      </div>
                    )}
                    {selectedLinks.size > 0 && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Generated from {selectedLinks.size} selected research link{selectedLinks.size > 1 ? 's' : ''}
                      </p>
                    )}
                    {mindMapData && (
                      <MindMapFlow data={mindMapData} />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {chatMessages.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Chat History</h3>
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary/10 ml-12"
                        : "bg-muted/50 mr-12"
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      {msg.role === "user" ? "You" : "AI Tutor"}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}

            {!summary && !generating && sources.length === 0 && (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sources yet</h3>
                <p className="text-muted-foreground">
                  Upload a PDF or add text to get started with AI-powered learning!
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Research Panel */}
      <div className="w-96 border-l border-border bg-card/50">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Research Links</h2>
            {selectedLinks.size > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                {selectedLinks.size} selected
              </span>
            )}
          </div>
          {researchLinks.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Select links to include in mind map
            </p>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {researchLinks.length > 0 ? (
              researchLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleLinkSelection(idx)}
                      className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedLinks.has(idx)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                    >
                      {selectedLinks.has(idx) && <CheckSquare className="h-3 w-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group"
                      >
                        <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary group-hover:text-primary/80" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {link.title}
                          </h3>
                          {('heading' in link || 'subheading' in link) && (
                            <p className="text-[11px] text-muted-foreground mb-1">
                              { (link as any).heading ? <><span className="font-medium">{(link as any).heading}</span>{(link as any).subheading ? ' • ' : ''}</> : null}
                              { (link as any).subheading ? <span>{(link as any).subheading}</span> : null }
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {link.description}
                          </p>
                          <p className="text-xs text-primary">{link.source}</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <ExternalLink className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Research links will appear here
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      {selectedKeyPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-3 text-xl font-semibold p-2 rounded hover:bg-muted"
              onClick={() => setSelectedKeyPoint(null)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-foreground text-lg whitespace-pre-line">
              {selectedKeyPoint.replace(/^\*+\s*/, '').replace(/\*+$/, '').trim()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
