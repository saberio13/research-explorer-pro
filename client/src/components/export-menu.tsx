import { useState, useRef, useEffect } from "react";
import type { SearchResult, PaperResult } from "@shared/schema";
import { Download, ChevronDown } from "lucide-react";

interface ExportMenuProps {
  results: SearchResult;
  query: string;
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toBibTeX(papers: PaperResult[]): string {
  return papers.map(p => {
    const key = `${(p.authors[0] || "Unknown").split(" ").pop()}${p.year}`;
    return `@article{${key},\n  title = {${p.title}},\n  author = {${p.authors.join(" and ")}},\n  journal = {${p.journal}},\n  year = {${p.year}},\n  url = {${p.url}}\n}`;
  }).join("\n\n");
}

function toCSV(papers: PaperResult[]): string {
  const header = "Title,Authors,Journal,Year,Citations,Stance,Study Type,URL";
  const rows = papers.map(p =>
    [p.title, p.authors.join("; "), p.journal, p.year, p.citations, p.stance, p.studyType, p.url]
      .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header, ...rows].join("\n");
}

export function ExportMenu({ results, query }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const slug = query.slice(0, 30).replace(/\s+/g, "-").toLowerCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    {
      label: "BibTeX (.bib)",
      action: () => downloadBlob(toBibTeX(results.papers), `${slug}.bib`, "text/plain"),
    },
    {
      label: "CSV (.csv)",
      action: () => downloadBlob(toCSV(results.papers), `${slug}.csv`, "text/csv"),
    },
    {
      label: "Print / PDF",
      action: () => window.print(),
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium hover:bg-accent transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg z-10 py-1">
          {options.map(({ label, action }) => (
            <button
              key={label}
              onClick={() => { action(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
