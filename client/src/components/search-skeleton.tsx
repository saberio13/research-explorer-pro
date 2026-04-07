import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const messages = [
  "Searching research literature…",
  "Analyzing papers…",
  "Synthesizing findings…",
];

export function SearchSkeleton() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground transition-all duration-300">
          {messages[msgIdx]}
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Left column skeletons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="h-4 w-20 skeleton-shimmer rounded mb-3" />
            <div className="space-y-2">
              <div className="h-3 skeleton-shimmer rounded w-full" />
              <div className="h-3 skeleton-shimmer rounded w-4/5" />
              <div className="h-3 skeleton-shimmer rounded w-3/5" />
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="h-4 w-32 skeleton-shimmer rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 skeleton-shimmer rounded-full flex-shrink-0" />
                  <div className="h-3 skeleton-shimmer rounded w-16 flex-shrink-0" />
                  <div className="flex-1 h-3 skeleton-shimmer rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — paper skeletons */}
        <div className="lg:col-span-3 space-y-3">
          <div className="h-4 w-32 skeleton-shimmer rounded mb-1" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton-shimmer rounded w-3/4" />
                  <div className="h-3 skeleton-shimmer rounded w-full" />
                  <div className="flex gap-2">
                    <div className="h-3 skeleton-shimmer rounded w-24" />
                    <div className="h-3 skeleton-shimmer rounded w-12" />
                    <div className="h-3 skeleton-shimmer rounded w-20" />
                  </div>
                </div>
                <div className="h-6 w-16 skeleton-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
