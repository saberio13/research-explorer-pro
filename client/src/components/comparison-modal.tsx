import type { PaperResult } from "@shared/schema";
import { X, Download } from "lucide-react";

interface ComparisonModalProps {
  papers: PaperResult[];
  onClose: () => void;
}

function toComparisonCSV(papers: PaperResult[]): string {
  const rows = [
    ["Field", ...papers.map(p => p.title)],
    ["Stance", ...papers.map(p => p.stance)],
    ["Study Type", ...papers.map(p => p.studyType)],
    ["Year", ...papers.map(p => String(p.year))],
    ["Sample Size", ...papers.map(p => p.sampleSize || "—")],
    ["Methodology", ...papers.map(p => p.methodology || "—")],
    ["Key Finding", ...papers.map(p => p.takeaway || "—")],
  ];
  return rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function ComparisonModal({ papers, onClose }: ComparisonModalProps) {
  const rows: { label: string; key: keyof PaperResult }[] = [
    { label: "Stance", key: "stance" },
    { label: "Study Type", key: "studyType" },
    { label: "Year", key: "year" },
    { label: "Sample Size", key: "sampleSize" },
    { label: "Methodology", key: "methodology" },
    { label: "Key Finding", key: "takeaway" },
  ];

  const handleExport = () => {
    const csv = toComparisonCSV(papers);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 backdrop-blur-sm p-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative bg-background border border-border rounded-xl w-full max-w-5xl shadow-xl my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Compare Papers ({papers.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-secondary rounded-md hover:bg-accent transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 w-28 text-muted-foreground font-medium">Field</th>
                {papers.map((p, i) => (
                  <th key={i} className="text-left p-2 font-medium text-foreground max-w-48">
                    <span className="line-clamp-2">{p.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ label, key }) => (
                <tr key={key} className="border-t border-border">
                  <td className="p-2 text-muted-foreground font-medium whitespace-nowrap">{label}</td>
                  {papers.map((p, i) => (
                    <td key={i} className="p-2 text-foreground align-top">
                      {String(p[key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
