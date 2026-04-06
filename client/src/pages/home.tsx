import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SearchResult, PaperResult, SavedPaper } from "@shared/schema";
import { SearchBar } from "@/components/search-bar";
import { ResultsView } from "@/components/results-view";
import { PaperModal } from "@/components/paper-modal";
import { LibraryView } from "@/components/library-view";
import { HistoryPanel } from "@/components/history-panel";
import { SearchSkeleton } from "@/components/search-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  BookOpen,
  Library,
  History,
  Search,
  FlaskConical,
} from "lucide-react";

type ViewMode = "search" | "library" | "history";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"question" | "topic" | "author" | "method">("question");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PaperResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("search");
  const [yearFrom, setYearFrom] = useState<number | undefined>();
  const [yearTo, setYearTo] = useState<number | undefined>();
  const [selectedStudyTypes, setSelectedStudyTypes] = useState<string[]>([]);

  const { data: savedPapers = [] } = useQuery<SavedPaper[]>({
    queryKey: ["/api/saved-papers"],
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["/api/history"],
  });

  const searchMutation = useMutation({
    mutationFn: async (params: {
      query: string;
      searchType: string;
      yearRange?: { from?: number; to?: number };
      studyTypes?: string[];
    }) => {
      const res = await apiRequest("POST", "/api/search", params);
      return res.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });

  const savePaperMutation = useMutation({
    mutationFn: async (paper: PaperResult & { searchQuery?: string }) => {
      const res = await apiRequest("POST", "/api/saved-papers", paper);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-papers"] });
    },
  });

  const deleteSavedPaperMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/saved-papers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-papers"] });
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setViewMode("search");
    searchMutation.mutate({
      query: searchQuery,
      searchType,
      yearRange: yearFrom || yearTo ? { from: yearFrom, to: yearTo } : undefined,
      studyTypes: selectedStudyTypes.length > 0 ? selectedStudyTypes : undefined,
    });
  };

  const handleSavePaper = (paper: PaperResult) => {
    const alreadySaved = savedPapers.find((p) => p.title === paper.title);
    if (alreadySaved) {
      deleteSavedPaperMutation.mutate(alreadySaved.id);
    } else {
      savePaperMutation.mutate({ ...paper, searchQuery });
    }
  };

  const isPaperSaved = (title: string) => {
    return savedPapers.some((p) => p.title === title);
  };

  const loadFromHistory = (item: any) => {
    try {
      const result = JSON.parse(item.resultJson);
      setSearchQuery(item.query);
      setSearchResults(result);
      setViewMode("search");
    } catch {}
  };

  const hasResults = searchResults && !searchMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => {
                setSearchResults(null);
                setViewMode("search");
                searchMutation.reset();
              }}
              className="flex items-center gap-2 group"
              data-testid="logo-button"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground text-sm">
                Research Explorer
              </span>
            </button>

            <nav className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setViewMode("search")}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                  viewMode === "search"
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-search"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button
                onClick={() => setViewMode("library")}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                  viewMode === "library"
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-library"
              >
                <Library className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Library</span>
                {savedPapers.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {savedPapers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewMode("history")}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${
                  viewMode === "history"
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="nav-history"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History</span>
              </button>
              <div className="w-px h-5 bg-border mx-0.5 sm:mx-1" />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {viewMode === "search" && (
          <>
            {/* Search Section */}
            {!hasResults && !searchMutation.isPending && (
              <div className="flex flex-col items-center pt-16 pb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-xl font-semibold text-foreground mb-1.5 text-center">
                  Explore Research Papers
                </h1>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                  Ask a question, search a topic, find an author, or explore a methodology.
                  AI-powered analysis with evidence-based answers.
                </p>
              </div>
            )}

            <div className={`${hasResults || searchMutation.isPending ? "mb-6" : "max-w-2xl mx-auto"}`}>
              <SearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                searchType={searchType}
                onSearchTypeChange={setSearchType}
                onSearch={handleSearch}
                isSearching={searchMutation.isPending}
                yearFrom={yearFrom}
                yearTo={yearTo}
                onYearFromChange={setYearFrom}
                onYearToChange={setYearTo}
                selectedStudyTypes={selectedStudyTypes}
                onStudyTypesChange={setSelectedStudyTypes}
              />
            </div>

            {searchMutation.isPending && <SearchSkeleton />}

            {searchMutation.isError && (
              <div className="max-w-2xl mx-auto mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">
                  Search failed. Please try again with a different query.
                </p>
              </div>
            )}

            {hasResults && (
              <ResultsView
                results={searchResults}
                onSelectPaper={setSelectedPaper}
                onSavePaper={handleSavePaper}
                isPaperSaved={isPaperSaved}
              />
            )}
          </>
        )}

        {viewMode === "library" && (
          <LibraryView
            papers={savedPapers}
            onDelete={(id) => deleteSavedPaperMutation.mutate(id)}
            onSelectPaper={(paper) => {
              const p: PaperResult = {
                title: paper.title,
                authors: JSON.parse(paper.authors || "[]"),
                journal: paper.journal || "",
                year: paper.year || 0,
                citations: paper.citations || 0,
                stance: (paper.stance as any) || "possibly",
                takeaway: paper.takeaway || "",
                abstract: paper.abstract || "",
                methodology: paper.methodology || "",
                sampleSize: paper.sampleSize || "",
                studyType: paper.studyType || "",
                url: paper.url || "",
              };
              setSelectedPaper(p);
            }}
          />
        )}

        {viewMode === "history" && (
          <HistoryPanel
            history={history}
            onLoad={loadFromHistory}
            onDelete={(id) => deleteHistoryMutation.mutate(id)}
          />
        )}
      </main>

      {/* Paper Modal */}
      {selectedPaper && (
        <PaperModal
          paper={selectedPaper}
          isSaved={isPaperSaved(selectedPaper.title)}
          onSave={() => handleSavePaper(selectedPaper)}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  );
}
