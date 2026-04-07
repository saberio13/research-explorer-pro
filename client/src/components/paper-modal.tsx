import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PaperResult } from "@shared/schema";
import {
  X,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Users,
  FlaskConical,
  FileText,
  MessageSquare,
  Lightbulb,
  Loader2,
  Send,
  Copy,
  Check,
} from "lucide-react";

interface PaperModalProps {
  paper: PaperResult;
  isSaved: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function PaperModal({ paper, isSaved, onSave, onClose }: PaperModalProps) {
  const [askQuery, setAskQuery] = useState("");
  const [askResponse, setAskResponse] = useState<string | null>(null);
  const [citationCopied, setCitationCopied] = useState(false);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", "/api/ask-paper", {
        paperTitle: paper.title,
        paperAuthors: paper.authors?.join(", ") || "",
        paperJournal: paper.journal || "",
        paperTakeaway: paper.takeaway || "",
        question,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setAskResponse(data.answer);
    },
  });

  const handleAsk = () => {
    if (!askQuery.trim() || askMutation.isPending) return;
    askMutation.mutate(askQuery);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border rounded-xl max-w-3xl w-full shadow-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground mb-2 leading-tight">
                {paper.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {paper.authors?.join(", ") || "Unknown authors"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {paper.journal && <span>{paper.journal}</span>}
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
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
              data-testid="close-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={onSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isSaved
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              data-testid="modal-save"
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              {isSaved ? "Saved" : "Save"}
            </button>
            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-accent transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Source
              </a>
            )}
            <button
              onClick={() => {
                const apa = `${paper.authors.join(", ")} (${paper.year}). ${paper.title}. ${paper.journal}. ${paper.url}`;
                navigator.clipboard.writeText(apa);
                setCitationCopied(true);
                setTimeout(() => setCitationCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-accent transition-colors"
            >
              {citationCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {citationCopied ? "Copied!" : "Copy Citation"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-5">
          {/* Key Takeaway */}
          {paper.takeaway && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-primary mb-1">Key Takeaway</h4>
                  <p className="text-sm text-foreground">{paper.takeaway}</p>
                </div>
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            {paper.methodology && (
              <div className="bg-card border border-border rounded-lg p-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Methodology
                </h5>
                <p className="text-sm text-foreground">{paper.methodology}</p>
              </div>
            )}
            {paper.sampleSize && (
              <div className="bg-card border border-border rounded-lg p-3">
                <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Sample Size
                </h5>
                <p className="text-sm text-foreground">{paper.sampleSize}</p>
              </div>
            )}
          </div>

          {/* Abstract */}
          {paper.abstract && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                Abstract
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract}</p>
            </div>
          )}

          {/* Ask About Paper */}
          <div className="bg-accent/50 border border-border rounded-lg p-4">
            <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              Ask About This Paper
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Ask questions to learn more about this research.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="What were the limitations of this study?"
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="ask-paper-input"
              />
              <button
                onClick={handleAsk}
                disabled={askMutation.isPending || !askQuery.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[60px] hover:opacity-90 transition-opacity"
                data-testid="ask-paper-submit"
              >
                {askMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {askResponse && (
              <div className="mt-3 p-3 bg-background border border-border rounded-md max-h-48 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {askResponse}
                </p>
              </div>
            )}
            {askMutation.isError && (
              <p className="mt-2 text-xs text-destructive">
                Could not process your question. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
