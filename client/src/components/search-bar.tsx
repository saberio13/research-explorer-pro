import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  HelpCircle,
  BookOpen,
  User,
  Microscope,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  searchType: "question" | "topic" | "author" | "method";
  onSearchTypeChange: (t: "question" | "topic" | "author" | "method") => void;
  onSearch: () => void;
  isSearching: boolean;
  yearFrom?: number;
  yearTo?: number;
  onYearFromChange: (y: number | undefined) => void;
  onYearToChange: (y: number | undefined) => void;
  selectedStudyTypes: string[];
  onStudyTypesChange: (types: string[]) => void;
}

const SEARCH_TYPES = [
  { value: "question" as const, label: "Question", icon: HelpCircle, placeholder: "Does exercise improve mental health?" },
  { value: "topic" as const, label: "Topic", icon: BookOpen, placeholder: "Climate change ocean acidification" },
  { value: "author" as const, label: "Author", icon: User, placeholder: "Geoffrey Hinton deep learning" },
  { value: "method" as const, label: "Method", icon: Microscope, placeholder: "Ensemble Kalman Filter data assimilation" },
];

const STUDY_TYPES = [
  "Meta Analysis",
  "Systematic Review",
  "RCT",
  "Cohort Study",
  "Observational Study",
  "Modeling Study",
  "Review",
  "Case Study",
];

const QUICK_SUGGESTIONS = [
  { label: "Ocean data assimilation", type: "topic" as const },
  { label: "Does meditation reduce anxiety?", type: "question" as const },
  { label: "EnKF vs 4DVAR performance", type: "method" as const },
  { label: "Machine learning weather prediction", type: "topic" as const },
  { label: "Does coffee improve cognition?", type: "question" as const },
  { label: "CMIP6 climate projections accuracy", type: "topic" as const },
];

export function SearchBar({
  query,
  onQueryChange,
  searchType,
  onSearchTypeChange,
  onSearch,
  isSearching,
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
  selectedStudyTypes,
  onStudyTypesChange,
}: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const currentType = SEARCH_TYPES.find((t) => t.value === searchType)!;

  const hasFilters = yearFrom || yearTo || selectedStudyTypes.length > 0;

  const clearFilters = () => {
    onYearFromChange(undefined);
    onYearToChange(undefined);
    onStudyTypesChange([]);
  };

  const toggleStudyType = (type: string) => {
    if (selectedStudyTypes.includes(type)) {
      onStudyTypesChange(selectedStudyTypes.filter((t) => t !== type));
    } else {
      onStudyTypesChange([...selectedStudyTypes, type]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Type Tabs */}
      <div className="flex items-center gap-1">
        {SEARCH_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.value}
              onClick={() => onSearchTypeChange(type.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                searchType === type.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              data-testid={`search-type-${type.value}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Main Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isSearching && onSearch()}
            placeholder={currentType.placeholder}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            data-testid="search-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
              showFilters || hasFilters
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            data-testid="filter-toggle"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>

          <button
            onClick={onSearch}
            disabled={!query.trim() || isSearching}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            data-testid="search-button"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching
              </>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Filters</span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                data-testid="clear-filters"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Year Range */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Publication Year
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="From"
                value={yearFrom || ""}
                onChange={(e) => onYearFromChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24 px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                min={1900}
                max={2026}
                data-testid="year-from"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="number"
                placeholder="To"
                value={yearTo || ""}
                onChange={(e) => onYearToChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-24 px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                min={1900}
                max={2026}
                data-testid="year-to"
              />
            </div>
          </div>

          {/* Study Types */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Study Types
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STUDY_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleStudyType(type)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedStudyTypes.includes(type)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                  data-testid={`study-type-${type.replace(/\s/g, "-").toLowerCase()}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions (only when no results) */}
      {!query && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground mr-1">Try:</span>
          {QUICK_SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                onQueryChange(s.label);
                onSearchTypeChange(s.type);
              }}
              className="px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition-colors"
              data-testid={`suggestion-${i}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
