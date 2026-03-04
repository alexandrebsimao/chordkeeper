import { useState, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, FileText, Upload, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeySelector } from "@/components/KeySelector";

export interface MediaReference {
  id?: number;
  media_type: "url" | "file";
  url: string;
  attachment?: File | null;
  file_url?: string | null;
  file_name?: string | null;
  description: string;
  _destroy?: boolean;
}

export interface SongFormData {
  title: string;
  artist: string;
  genre: string;
  original_key: string;
  bpm: number | null;
  capo: number | null;
  content: string;
  convert_pdf: boolean;
  attachment?: File | null;
  attachment_url?: string | null;
  media_references: MediaReference[];
}

// Cifra to ChordPro Converter Functions
const CHORD_RE = /\b([A-G][#b]?(?:m|M|maj|min|sus\d*|aug|dim|add\d*|dom|\d+[Mmsud]*)?\d*(?:\/[A-G][#b]?)?)\b/g;

function isChordLine(line: string): boolean {
  if (!line || line.trim() === "") return false;
  const stripped = line.replace(CHORD_RE, "").trim();
  return stripped.length === 0;
}

function extractChordsWithPositions(line: string): Array<{ chord: string; pos: number }> {
  const pattern = new RegExp(CHORD_RE.source, "g");
  const chords: Array<{ chord: string; pos: number }> = [];
  let match;
  while ((match = pattern.exec(line)) !== null) {
    chords.push({ chord: match[0], pos: match.index });
  }
  return chords;
}

function mergeChordAndLyric(chordLine: string, lyricLine: string): string {
  const chords = extractChordsWithPositions(chordLine);
  if (chords.length === 0) return lyricLine;

  const insertions: Record<number, string[]> = {};
  const appended: string[] = [];

  for (const { chord, pos } of chords) {
    if (pos >= lyricLine.length) {
      appended.push(`[${chord}]`);
    } else {
      if (!insertions[pos]) insertions[pos] = [];
      insertions[pos].push(`[${chord}]`);
    }
  }

  let result = "";
  for (let col = 0; col <= lyricLine.length; col++) {
    if (insertions[col]) {
      result += insertions[col].join("");
    }
    if (col < lyricLine.length) {
      result += lyricLine[col];
    }
  }

  if (appended.length) result += " " + appended.join(" ");

  return result;
}

function convertBodyLines(lines: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      out.push("");
      i++;
      continue;
    }

    const parenMatch = line.match(/^\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
      const tokens = parenMatch[1].trim().split(/\s+/).filter(Boolean);
      out.push(tokens.map((c) => `[${c}]`).join(" "));
      i++;
      continue;
    }

    if (isChordLine(line)) {
      const next = lines[i + 1];
      const nextIsLyric =
        next !== undefined &&
        next.trim() !== "" &&
        !isChordLine(next) &&
        !next.match(/^\[/) &&
        !next.match(/^\s*\(/);

      if (nextIsLyric) {
        out.push(mergeChordAndLyric(line, next));
        i += 2;
      } else {
        const chords = extractChordsWithPositions(line).map((c) => `[${c.chord}]`);
        out.push(chords.join(" "));
        i++;
      }
      continue;
    }

    out.push(line);
    i++;
  }

  return out;
}

function convertCifraToChordPro(input: string): string {
  const rawLines = input.split("\n");

  const blocks: Array<{ section: string | null; headerChords: string; lines: string[] }> = [];
  let current = { section: null as string | null, headerChords: "", lines: [] as string[] };

  for (const line of rawLines) {
    const secMatch = line.match(/^\[([^\]]+)\](.*)/);
    if (secMatch) {
      blocks.push(current);
      current = {
        section: secMatch[1].trim(),
        headerChords: secMatch[2].trim(),
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }
  blocks.push(current);

  const outputLines: string[] = [];

  for (const block of blocks) {
    const bodyLines = convertBodyLines(block.lines);

    if (block.section === null) {
      outputLines.push(...bodyLines);
    } else {
      outputLines.push(`{start_of_verse: ${block.section}}`);
      if (block.headerChords) {
        const tokens = block.headerChords.split(/\s+/).filter(Boolean);
        outputLines.push(tokens.map((c) => `[${c}]`).join(" "));
      }
      outputLines.push(...bodyLines);
      outputLines.push("{end_of_verse}");
    }
  }

  return outputLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ChordPro Parser Functions
function parseChordPro(text: string) {
  const lines = text.split("\n");
  const meta: Record<string, string> = {};
  const sections: any[] = [];
  let currentSection: any = null;

  const metaDirectives = ["title", "artist", "key", "tempo", "capo", "time"];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim(); // Remove espaços extras

    const metaMatch = line.match(/^\{(\w+):\s*(.+)\}$/);
    if (metaMatch) {
      const [, directive, value] = metaMatch;
      if (metaDirectives.includes(directive)) {
        meta[directive] = value.trim();
        continue;
      }
    }

    const sectionStartMatch = line.match(/^\{start_of_(\w+)(?::\s*(.+))?\}$/);
    if (sectionStartMatch) {
      const [, type, label] = sectionStartMatch;
      currentSection = { type, label: label || type, lines: [] };
      sections.push(currentSection);
      continue;
    }

    const sectionEndMatch = line.match(/^\{end_of_(\w+)\}$/);
    if (sectionEndMatch) {
      currentSection = null;
      continue;
    }

    const commentMatch = line.match(/^\{comment:\s*(.+)\}$/);
    if (commentMatch) {
      const commentSection = {
        type: "comment",
        label: commentMatch[1],
        lines: [],
      };
      sections.push(commentSection);
      currentSection = commentSection;
      continue;
    }

    if (line.trim() !== "" || currentSection) {
      const parsedLine = parseChordLine(line);
      if (currentSection) {
        currentSection.lines.push(parsedLine);
      } else {
        if (sections.length === 0 || sections[sections.length - 1].type === "comment") {
          currentSection = { type: "verse", label: "", lines: [] };
          sections.push(currentSection);
        }
        sections[sections.length - 1].lines.push(parsedLine);
      }
    }
  }

  return { meta, sections };
}

function parseChordLine(line: string) {
  const segments: any[] = [];
  const regex = /\[([^\]]+)\]([^\[]*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ chord: null, text: line.slice(lastIndex, match.index) });
    }
    segments.push({ chord: match[1], text: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({ chord: null, text: line.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ chord: null, text: line });
  }

  const hasChords = segments.some((s: any) => s.chord !== null);
  return { segments, hasChords };
}

// ChordPro Components
function SectionLabel({ type, label }: { type: string; label: string }) {
  const typeColors: Record<string, any> = {
    verse: { bg: "rgba(99,102,241,0.15)", border: "#6366f1", text: "#818cf8" },
    chorus: { bg: "rgba(236,72,153,0.15)", border: "#ec4899", text: "#f472b6" },
    bridge: { bg: "rgba(20,184,166,0.15)", border: "#14b8a6", text: "#2dd4bf" },
    comment: { bg: "rgba(251,191,36,0.15)", border: "#fbbf24", text: "#fcd34d" },
  };

  const colors = typeColors[type] || typeColors.verse;
  const displayLabel = label || type;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 12px",
        borderRadius: "20px",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        marginBottom: "12px",
        marginTop: "6px",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontFamily: "'DM Mono', monospace",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: colors.text,
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
}

function ChordLine({ line }: { line: any }) {
  if (!line.hasChords) {
    return (
      <div
        style={{
          fontFamily: "'Lora', serif",
          fontSize: "16px",
          color: "#1e293b",
          lineHeight: "1.8",
          marginBottom: "4px",
        }}
      >
        {line.segments.map((s: any) => s.text).join("")}
      </div>
    );
  }

  // Monta duas linhas: acordes e letra (seguindo a mesma lógica do backend)
  let chordsLine = "";
  let lyricsLine = "";
  const minSpacing = 2;

  for (const seg of line.segments) {
    if (seg.chord) {
      const chordText = seg.chord;
      const lyricText = seg.text || "";
      
      // Adiciona o acorde
      chordsLine += chordText;
      
      // Calcula espaçamento
      if (lyricText.length > chordText.length) {
        // Letra maior que acorde: completa acordes com espaços
        chordsLine += " ".repeat(lyricText.length - chordText.length);
      } else if (!lyricText || !lyricText.trim()) {
        // Cifra isolada: adiciona espaçamento mínimo
        chordsLine += " ".repeat(minSpacing);
      }
      
      // Adiciona a letra
      lyricsLine += lyricText;
      
      // Se acorde é maior que letra, adiciona espaços na letra
      if (chordText.length > lyricText.length) {
        lyricsLine += " ".repeat(chordText.length - lyricText.length);
      } else if (!lyricText || !lyricText.trim()) {
        // Cifra isolada: adiciona espaçamento mínimo
        lyricsLine += " ".repeat(minSpacing);
      }
    } else {
      // Sem acorde, apenas texto
      const textLength = seg.text.length;
      chordsLine += " ".repeat(textLength);
      lyricsLine += seg.text;
    }
  }

  return (
    <div style={{ marginBottom: "10px" }}>
      {/* Linha de acordes */}
      {chordsLine.trim() && (
        <div
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "#ec4899",
            lineHeight: "1.3",
            whiteSpace: "pre",
            marginBottom: "0",
          }}
        >
          {chordsLine.trimEnd()}
        </div>
      )}
      {/* Linha de letras */}
      {lyricsLine.trim() && (
        <div
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "16px",
            color: "#1e293b",
            lineHeight: "1.3",
            whiteSpace: "pre",
            marginTop: "0",
          }}
        >
          {lyricsLine.trimEnd()}
        </div>
      )}
    </div>
  );
}

function SongViewer({ text }: { text: string }) {
  const { meta, sections } = parseChordPro(text);

  const tagStyle = (color: string) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "20px",
    background: `${color}22`,
    border: `1px solid ${color}55`,
    color: color,
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.05em",
  });

  return (
    <div
      style={{
        height: "100%",
        padding: "24px",
        background: "#f8fafc",
        borderRadius: "8px",
      }}
    >
      {(meta.title || meta.artist) && (
        <div style={{ marginBottom: "24px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
          {meta.title && (
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#0f172a",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {meta.title}
            </h2>
          )}
          {meta.artist && (
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "14px",
                color: "#64748b",
                margin: "6px 0 0",
              }}
            >
              {meta.artist}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            {meta.key && <span style={tagStyle("#6366f1")}>🎵 Tom: {meta.key}</span>}
            {meta.tempo && <span style={tagStyle("#14b8a6")}>♩ {meta.tempo} BPM</span>}
            {meta.capo && <span style={tagStyle("#f59e0b")}>Capotraste: {meta.capo}</span>}
          </div>
        </div>
      )}

      {sections.map((section, si) => (
        <div key={si} style={{ marginBottom: "20px" }}>
          {(section.label || section.type !== "verse") && (
            <SectionLabel type={section.type} label={section.label} />
          )}
          <div>
            {section.lines.map((line: any, li: number) => (
              <ChordLine key={li} line={line} />
            ))}
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div style={{ color: "#94a3b8", fontFamily: "'DM Mono', monospace", fontSize: "14px", textAlign: "center", marginTop: "40px" }}>
          Digite sua cifra no formato ChordPro
        </div>
      )}
    </div>
  );
}

const QUICK_INSERTS = [
  // { label: "{title: }", insert: "{title: }" },
  // { label: "{artist: }", insert: "{artist: }" },
  // { label: "{key: }", insert: "{key: }" },
  { label: "Verso", insert: "{start_of_verse: Verso 1}\n\n{end_of_verse}" },
  { label: "Refrão", insert: "{start_of_chorus: Refrão}\n\n{end_of_chorus}" },
  { label: "Ponte", insert: "{start_of_bridge: Ponte}\n\n{end_of_bridge}" },
  { label: "[Acorde]", insert: "[C]" },
];

interface SongFormProps {
  initialData?: Partial<SongFormData>;
  onSubmit: (data: SongFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

/**
 * Unified form component for creating and editing songs.
 * 
 * @example
 * ```tsx
 * // Create mode
 * <SongForm 
 *   onSubmit={handleCreate}
 *   onCancel={() => navigate('/songs')}
 *   submitLabel="Criar Música"
 * />
 * 
 * // Edit mode
 * <SongForm 
 *   initialData={existingSong}
 *   onSubmit={handleUpdate}
 *   onCancel={() => navigate(`/songs/${id}`)}
 *   submitLabel="Salvar Alterações"
 * />
 * ```
 */
export function SongForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
  loading = false,
}: SongFormProps) {
  const [contentTab, setContentTab] = useState<"text" | "file">(
    initialData?.attachment_url && !initialData?.content ? "file" : "text"
  );
  const [editorView, setEditorView] = useState<"split" | "editor" | "viewer">("split");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);
  
  // Converter modal state
  const [converterOpen, setConverterOpen] = useState(false);
  const [cifraInput, setCifraInput] = useState("");

  const [formData, setFormData] = useState<SongFormData>({
    title: initialData?.title || "",
    artist: initialData?.artist || "",
    genre: initialData?.genre || "",
    original_key: initialData?.original_key || "",
    bpm: initialData?.bpm || null,
    capo: initialData?.capo || null,
    content: initialData?.content || "",
    convert_pdf: initialData?.convert_pdf || false,
    attachment: initialData?.attachment || null,
    attachment_url: initialData?.attachment_url || null,
    media_references: initialData?.media_references || [],
  });

  // Atualiza formData quando initialData mudar (carregamento assíncrono)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData?.title || "",
        artist: initialData?.artist || "",
        genre: initialData?.genre || "",
        original_key: initialData?.original_key || "",
        bpm: initialData?.bpm || null,
        capo: initialData?.capo || null,
        content: initialData?.content || "",
        convert_pdf: initialData?.convert_pdf || false,
        attachment: initialData?.attachment || null,
        attachment_url: initialData?.attachment_url || null,
        media_references: initialData?.media_references || [],
      });
    }
  }, [
    initialData?.title,
    initialData?.artist,
    initialData?.genre,
    initialData?.original_key,
    initialData?.bpm,
    initialData?.capo,
    initialData?.content,
    initialData?.convert_pdf,
    initialData?.attachment_url,
  ]);

  const insertAtCursor = useCallback((snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newContent = formData.content.slice(0, start) + snippet + formData.content.slice(end);
    setFormData({ ...formData, content: newContent });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 0);
  }, [formData]);

  const handleConvertCifra = useCallback(() => {
    const converted = convertCifraToChordPro(cifraInput);
    setFormData({ ...formData, content: converted });
    setConverterOpen(false);
    setCifraInput("");
  }, [cifraInput, formData]);

  // Sincronização de scroll entre editor e visualizador
  const handleEditorScroll = useCallback(() => {
    if (syncingScrollRef.current || editorView !== "split") return;
    
    const editor = textareaRef.current;
    const viewer = viewerRef.current;
    if (!editor || !viewer) return;

    syncingScrollRef.current = true;
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    viewer.scrollTop = scrollPercentage * (viewer.scrollHeight - viewer.clientHeight);
    
    setTimeout(() => {
      syncingScrollRef.current = false;
    }, 50);
  }, [editorView]);

  const handleViewerScroll = useCallback(() => {
    if (syncingScrollRef.current || editorView !== "split") return;
    
    const editor = textareaRef.current;
    const viewer = viewerRef.current;
    if (!editor || !viewer) return;

    syncingScrollRef.current = true;
    const scrollPercentage = viewer.scrollTop / (viewer.scrollHeight - viewer.clientHeight);
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight);
    
    setTimeout(() => {
      syncingScrollRef.current = false;
    }, 50);
  }, [editorView]);

  const handleAddMediaReference = () => {
    setFormData({
      ...formData,
      media_references: [
        ...formData.media_references,
        {
          media_type: "url",
          url: "",
          attachment: null,
          description: "",
        },
      ],
    });
  };

  const handleRemoveMediaReference = (index: number) => {
    const updated = [...formData.media_references];
    if (updated[index].id) {
      // Mark for deletion if it has an ID (existing record)
      updated[index]._destroy = true;
    } else {
      // Remove from array if it's new
      updated.splice(index, 1);
    }
    setFormData({ ...formData, media_references: updated });
  };

  const handleMediaReferenceChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...formData.media_references];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, media_references: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nome da música"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artista *</Label>
            <Input
              id="artist"
              placeholder="Nome do artista"
              value={formData.artist}
              onChange={(e) =>
                setFormData({ ...formData, artist: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Gênero</Label>
              <Input
                id="genre"
                placeholder="Ex: Pop, Rock"
                value={formData.genre}
                onChange={(e) =>
                  setFormData({ ...formData, genre: e.target.value })
                }
              />
            </div>

            <KeySelector
              value={formData.original_key}
              onChange={(value) =>
                setFormData({ ...formData, original_key: value })
              }
              label="Tom Original *"
              placeholder="Selecione o tom"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                value={formData.bpm || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bpm: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capo">Capotraste</Label>
              <Input
                id="capo"
                type="number"
                placeholder="0"
                min="0"
                max="12"
                value={formData.capo || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  const limitedValue = value !== null ? Math.max(0, Math.min(12, value)) : null;
                  setFormData({
                    ...formData,
                    capo: limitedValue,
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Cifra/Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={contentTab} onValueChange={(value: any) => setContentTab(value)} className="w-full">
            {/* <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                Digitar
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2">
                <Upload className="h-4 w-4" />
                Anexar arquivo
              </TabsTrigger>
            </TabsList> */}

            <TabsContent value="text" className="mt-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editorView === "editor" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorView("editor")}
                  >
                    Editor
                  </Button>
                  <Button
                    type="button"
                    variant={editorView === "split" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorView("split")}
                  >
                    Split
                  </Button>
                  <Button
                    type="button"
                    variant={editorView === "viewer" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditorView("viewer")}
                  >
                    Visualização
                  </Button>
                </div>
              </div>

              {/* Toolbar de inserções rápidas */}
              {(editorView === "editor" || editorView === "split") && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border">
                  <span className="text-xs text-muted-foreground mr-2 self-center">Inserir:</span>
                  {QUICK_INSERTS.map((item, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => insertAtCursor(item.insert)}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <div className="flex-1" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7 gap-1.5"
                    onClick={() => setConverterOpen(true)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Converter Cifra
                  </Button>
                </div>
              )}

              {/* Editor ChordPro */}
              <div className="border rounded-lg overflow-hidden" style={{ height: "500px" }}>
                <div className="flex h-full">
                  {/* Editor */}
                  {(editorView === "editor" || editorView === "split") && (
                    <div className={`flex flex-col ${editorView === "split" ? "w-1/2" : "w-full"}`}>
                      <div className="bg-muted/50 px-3 py-2 border-b">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                          ✏️ ChordPro
                        </span>
                      </div>
                      <textarea
                        ref={textareaRef}
                        id="content"
                        placeholder={`{start_of_verse: Verso 1}\n[C]Letra [G]da [Am]música\n{end_of_verse}`}
                        value={formData.content}
                        onChange={(e) =>
                          setFormData({ ...formData, content: e.target.value })
                        }
                        onScroll={handleEditorScroll}
                        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-background"
                        required={contentTab === "text"}
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {/* Divider */}
                  {editorView === "split" && (
                    <div className="w-px bg-border" />
                  )}

                  {/* Viewer */}
                  {(editorView === "viewer" || editorView === "split") && (
                    <div className={`flex flex-col ${editorView === "split" ? "w-1/2" : "w-full"}`}>
                      <div className="bg-muted/50 px-3 py-2 border-b">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                          🎵 Visualização
                        </span>
                      </div>
                      <div 
                        ref={viewerRef}
                        onScroll={handleViewerScroll}
                        className="flex-1 overflow-auto"
                      >
                        <SongViewer text={formData.content} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="mt-4 space-y-2">
              {/* <Label htmlFor="attachment">Arquivo (PDF ou DOC)</Label>
              
              {formData.attachment_url && !formData.attachment && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📄 Arquivo atual anexado
                  </p>
                  <a 
                    href={formData.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Ver arquivo atual
                  </a>
                </div>
              )}
              
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Input
                  id="attachment"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attachment: e.target.files?.[0] || null,
                    })
                  }
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.attachment 
                    ? `📄 ${formData.attachment.name}` 
                    : formData.attachment_url 
                    ? "Selecione um novo arquivo para substituir" 
                    : "Selecione um arquivo"}
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={formData.convert_pdf}
                  onChange={(e) =>
                    setFormData({ ...formData, convert_pdf: e.target.checked })
                  }
                />
                <span className="text-sm">Converter PDF para cifra automaticamente</span>
              </label> */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mídias de Referência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mídias de Referência</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMediaReference}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.media_references.filter(m => !m._destroy).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma mídia de referência. Clique em "Adicionar" para incluir.
            </p>
          ) : (
            formData.media_references.map((media, index) => 
              !media._destroy && (
                <div
                  key={index}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <select
                      value={media.media_type}
                      onChange={(e) =>
                        handleMediaReferenceChange(
                          index,
                          "media_type",
                          e.target.value
                        )
                      }
                      className="px-3 py-2 border rounded-md bg-white text-sm"
                    >
                      <option value="url">URL</option>
                      <option value="file">Arquivo</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMediaReference(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  {media.media_type === "url" ? (
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        placeholder="https://..."
                        value={media.url}
                        onChange={(e) =>
                          handleMediaReferenceChange(index, "url", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Arquivo</Label>
                      {media.file_url && !media.attachment && (
                        <div className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50">
                          <p className="text-xs sm:text-sm font-medium mb-2 truncate" title={media.file_name || ''}>
                            {media.file_name || 'Arquivo anexado'}
                          </p>
                          <audio
                            controls
                            className="w-full h-8 sm:h-10"
                            controlsList="nodownload"
                          >
                            <source src={media.file_url} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                          </audio>
                        </div>
                      )}
                      <Input
                        type="file"
                        onChange={(e) =>
                          handleMediaReferenceChange(
                            index,
                            "attachment",
                            e.target.files?.[0] || null
                          )
                        }
                      />
                      {media.attachment && (
                        <p className="text-sm text-muted-foreground">
                          📄 {media.attachment.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Ex: Versão original"
                      value={media.description}
                      onChange={(e) =>
                        handleMediaReferenceChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )
            )
          )}
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>

      {/* Modal de Conversão de Cifra */}
      <Dialog open={converterOpen} onOpenChange={setConverterOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Converter Letra Cifrada
            </DialogTitle>
            <DialogDescription>
              Cole a letra cifrada no formato tradicional (acordes acima da letra). 
              Exemplo: <code className="text-xs bg-muted px-1 py-0.5 rounded">[Intro] C C4</code> ou acordes em linhas separadas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 py-4">
            <Label htmlFor="cifra-input" className="text-sm font-medium mb-2 block">
              Letra Cifrada Tradicional
            </Label>
            <textarea
              id="cifra-input"
              className="w-full h-[400px] p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={`[Intro] C  C4  C  C4\n\n[Primeira Parte]\n\n         C\nTe amo, Deus\n      F7M/C      C\nTua graça nunca falha`}
              value={cifraInput}
              onChange={(e) => setCifraInput(e.target.value)}
              spellCheck={false}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConverterOpen(false);
                setCifraInput("");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConvertCifra}
              disabled={!cifraInput.trim()}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Converter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
