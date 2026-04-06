import { History, Trash2, ArrowRight, Clock } from "lucide-react";

interface HistoryPanelProps {
  history: any[];
  onLoad: (item: any) => void;
  onDelete: (id: number) => void;
}

export function HistoryPanel({ history, onLoad, onDelete }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
          <History className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No search history</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Your past searches will appear here so you can quickly revisit results.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Search History ({history.length})
      </h2>
      <div className="space-y-2">
        {history.map((item) => {
          const date = new Date(item.createdAt);
          const timeStr = date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          let paperCount = 0;
          try {
            const result = JSON.parse(item.resultJson);
            paperCount = result.papers?.length || 0;
          } catch {}

          return (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 group hover:border-primary/40 transition-colors"
              data-testid={`history-item-${item.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.query}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>{timeStr}</span>
                  {paperCount > 0 && (
                    <>
                      <span className="text-border">|</span>
                      <span>{paperCount} papers</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onLoad(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/15 transition-colors"
                  data-testid={`load-history-${item.id}`}
                >
                  View
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  data-testid={`delete-history-${item.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
