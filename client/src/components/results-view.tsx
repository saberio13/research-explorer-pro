import { useState } from "react";
import type { SearchResult, PaperResult } from "@shared/schema";
import { ExportMenu } from "./export-menu";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Share2,
  Check,
} from "lucide-react";

interface ResultsViewProps {
  results: SearchResult;
  query: string;
  onSelectPaper: (paper: PaperResult) => void;
  onSavePaper: (paper: PaperResult) => void;
  isPaperSaved: (title: string) => boolean;
  onRelatedSearch?: (q: string) => void;
  onComparePapers?: (papers: PaperResult[]) => void;
}

function StanceBadge({ stance }: { stance: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    yes: { bg: "bg-chart-2/10", text: "text-chart-2", label: "Supports" },
    possibly: { bg: "bg-chart-4/10", text: "text-chart-4", label: "Mixed" },
    no: { bg: "bg-destructive/10", text: "text-destructive", label: "Against" },
  };
  const c = config[stance] || config.possibly;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function StudyTypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground border border-border">
      {type}
    </span>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-accent transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : "Share"}
    </button>
  );
}

export function ResultsView({
  results,
  query,
  onSelectPaper,
  onSavePaper,
  isPaperSaved,
  onRelatedSearch,
  onComparePapers,
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"results" | "synthesis">("results");
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set());

  const toggleCompare = (title: string, checked: boolean) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev);
      if (checked) next.add(title); else next.delete(title);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar + tabs */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("results")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === "results"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Results
          </button>
          <button
            onClick={() => setActiveTab("synthesis")}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === "synthesis"
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Synthesis
          </button>
        </div>
        <div className="flex items-center gap-2 pb-px">
          {results.cached && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground border border-border">
              <Clock className="w-3 h-3" /> Cached
            </span>
          )}
          <ShareButton />
          <ExportMenu results={results} query={query} />
        </div>
      </div>

      {activeTab === "results" && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{results.summary}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Consensus</h3>
                <span className="text-xs text-muted-foreground">
                  {results.consensusMeter?.totalPapers || 0} papers
                </span>
              </div>
              <div className="space-y-3">
                <ConsensusBand
                  icon={<CheckCircle2 className="w-4 h-4 text-chart-2" />}
                  label="Supports"
                  value={results.consensusMeter?.yes || 0}
                  color="bg-chart-2"
                />
                <ConsensusBand
                  icon={<AlertCircle className="w-4 h-4 text-chart-4" />}
                  label="Mixed"
                  value={results.consensusMeter?.possibly || 0}
                  color="bg-chart-4"
                />
                <ConsensusBand
                  icon={<XCircle className="w-4 h-4 text-destructive" />}
                  label="Against"
                  value={results.consensusMeter?.no || 0}
                  color="bg-destructive"
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Papers ({results.papers?.length || 0})
            </h3>
            {results.papers?.map((paper, i) => (
              <PaperCard
                key={i}
                paper={paper}
                onClick={() => onSelectPaper(paper)}
                onSave={() => onSavePaper(paper)}
                isSaved={isPaperSaved(paper.title)}
                selectedForCompare={selectedForCompare.has(paper.title)}
                onToggleCompare={(checked) => toggleCompare(paper.title, checked)}
              />
            ))}

            {/* Related searches */}
            {results.relatedQueries && results.relatedQueries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Related searches</p>
                <div className="flex flex-wrap gap-2">
                  {results.relatedQueries.map(q => (
                    <button
                      key={q}
                      onClick={() => onRelatedSearch?.(q)}
                      className="px-3 py-1.5 text-xs bg-secondary hover:bg-accent border border-border rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "synthesis" && <SynthesisView results={results} />}

      {/* Floating compare bar */}
      {selectedForCompare.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-card border border-border rounded-full px-4 py-2 shadow-lg">
          <span className="text-xs font-medium text-foreground">
            {selectedForCompare.size} papers selected
          </span>
          <button
            onClick={() => {
              const selected = results.papers.filter(p => selectedForCompare.has(p.title));
              onComparePapers?.(selected);
            }}
            className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
          >
            Compare
          </button>
          <button
            onClick={() => setSelectedForCompare(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

function ConsensusBand({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-xs font-medium text-muted-foreground w-14">{label}</span>
      <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

function PaperCard({
  paper, onClick, onSave, isSaved, selectedForCompare, onToggleCompare,
}: {
  paper: PaperResult;
  onClick: () => void;
  onSave: () => void;
  isSaved: boolean;
  selectedForCompare: boolean;
  onToggleCompare: (checked: boolean) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border rounded-lg p-4 hover:border-primary/40 transition-colors cursor-pointer group ${
        selectedForCompare ? "border-primary/60 ring-1 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5">
            {paper.title}
          </h4>
          {paper.takeaway && (
            <p className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-md px-3 py-2 mb-2">
              {paper.takeaway}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {paper.journal && <span className="font-medium">{paper.journal}</span>}
            {paper.year > 0 && (
              <>
                <span className="text-border">|</span>
                <span>{paper.year}</span>
              </>
            )}
            {paper.citations > 0 && (
              <>
                <span className="text-border">|</span>
                <span>{paper.citations} citations</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {paper.studyType && <StudyTypeBadge type={paper.studyType} />}
            <StanceBadge stance={paper.stance} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            className={`p-1.5 rounded-md transition-colors ${
              isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <input
            type="checkbox"
            checked={selectedForCompare}
            onClick={e => e.stopPropagation()}
            onChange={e => { e.stopPropagation(); onToggleCompare(e.target.checked); }}
            title="Select for comparison"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-3.5 h-3.5 cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

function SynthesisView({ results }: { results: SearchResult }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-foreground leading-relaxed">{results.summary}</p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Key Findings
        </h3>
        <div className="space-y-3">
          {results.keyFindings?.map((finding, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{finding.text}</p>
                <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  finding.confidence === "high"
                    ? "bg-chart-2/10 text-chart-2"
                    : finding.confidence === "medium"
                    ? "bg-chart-4/10 text-chart-4"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {finding.confidence} confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-accent/50 border border-border rounded-lg p-5">
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Conclusion
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{results.conclusion}</p>
      </div>
    </div>
  );
}
