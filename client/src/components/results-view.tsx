import { useState } from "react";
import type { SearchResult, PaperResult } from "@shared/schema";
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
} from "lucide-react";

interface ResultsViewProps {
  results: SearchResult;
  onSelectPaper: (paper: PaperResult) => void;
  onSavePaper: (paper: PaperResult) => void;
  isPaperSaved: (title: string) => boolean;
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

export function ResultsView({ results, onSelectPaper, onSavePaper, isPaperSaved }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<"results" | "synthesis">("results");

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 transition-colors ${
            activeTab === "results"
              ? "border-primary text-primary font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-results"
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
          data-testid="tab-synthesis"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Synthesis
        </button>
      </div>

      {activeTab === "results" && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left Column — Summary & Consensus */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-foreground">Summary</h3>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {results.summary}
              </p>
            </div>

            {/* Consensus Meter */}
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

          {/* Right Column — Paper List */}
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
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "synthesis" && (
        <SynthesisView results={results} />
      )}
    </div>
  );
}

function ConsensusBand({
  icon,
  label,
  value,
  color,
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
        <div
          className={`h-full rounded-full animate-bar ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

function PaperCard({
  paper,
  onClick,
  onSave,
  isSaved,
}: {
  paper: PaperResult;
  onClick: () => void;
  onSave: () => void;
  isSaved: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors cursor-pointer group"
      data-testid={`paper-card-${paper.title.slice(0, 20).replace(/\s/g, "-")}`}
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
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`p-1.5 rounded-md transition-colors ${
              isSaved
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            data-testid={`save-paper-${paper.title.slice(0, 10).replace(/\s/g, "-")}`}
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
        </div>
      </div>
    </div>
  );
}

function SynthesisView({ results }: { results: SearchResult }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-foreground leading-relaxed">{results.summary}</p>
      </div>

      {/* Key Findings */}
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
                <span
                  className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    finding.confidence === "high"
                      ? "bg-chart-2/10 text-chart-2"
                      : finding.confidence === "medium"
                      ? "bg-chart-4/10 text-chart-4"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {finding.confidence} confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
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
