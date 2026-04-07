import { useState } from "react";
import type { SavedPaper } from "@shared/schema";
import { Trash2, ExternalLink, Library } from "lucide-react";

interface LibraryViewProps {
  papers: SavedPaper[];
  onDelete: (id: number) => void;
  onSelectPaper: (paper: SavedPaper) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}

function LibraryCard({
  paper,
  onDelete,
  onSelectPaper,
  onUpdateNotes,
}: {
  paper: SavedPaper;
  onDelete: (id: number) => void;
  onSelectPaper: (paper: SavedPaper) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteText, setNoteText] = useState(paper.notes || "");

  const authors = (() => {
    try { return JSON.parse(paper.authors || "[]"); } catch { return []; }
  })();

  return (
    <div
      onClick={() => onSelectPaper(paper)}
      className="bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {paper.title}
          </h4>
          {paper.takeaway && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{paper.takeaway}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {authors.length > 0 && (
              <span>{authors.slice(0, 2).join(", ")}{authors.length > 2 ? " et al." : ""}</span>
            )}
            {paper.journal && (
              <>
                <span className="text-border">|</span>
                <span>{paper.journal}</span>
              </>
            )}
            {paper.year && (
              <>
                <span className="text-border">|</span>
                <span>{paper.year}</span>
              </>
            )}
            {paper.studyType && (
              <>
                <span className="text-border">|</span>
                <span className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-medium">
                  {paper.studyType}
                </span>
              </>
            )}
          </div>

          {/* Notes */}
          <div className="mt-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setNotesOpen(o => !o)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {notesOpen ? "Hide note" : paper.notes ? "Edit note" : "Add note"}
            </button>
            {notesOpen && (
              <div className="mt-1.5">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onBlur={() => onUpdateNotes(paper.id, noteText)}
                  maxLength={500}
                  placeholder="Add your notes about this paper…"
                  className="w-full text-xs p-2 bg-background border border-border rounded resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                  {noteText.length}/500
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {paper.url && (
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(paper.id); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibraryView({ papers, onDelete, onSelectPaper, onUpdateNotes }: LibraryViewProps) {
  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
          <Library className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No saved papers</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Save papers from search results by clicking the bookmark icon. They will appear here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Saved Papers ({papers.length})
        </h2>
      </div>
      <div className="space-y-2">
        {papers.map(paper => (
          <LibraryCard
            key={paper.id}
            paper={paper}
            onDelete={onDelete}
            onSelectPaper={onSelectPaper}
            onUpdateNotes={onUpdateNotes}
          />
        ))}
      </div>
    </div>
  );
}
