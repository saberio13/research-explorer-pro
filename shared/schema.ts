import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Search history
export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: text("created_at").notNull(),
  cacheKey: text("cache_key"),
});

// Saved papers
export const savedPapers = sqliteTable("saved_papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  authors: text("authors").notNull(), // JSON array
  journal: text("journal"),
  year: integer("year"),
  citations: integer("citations"),
  stance: text("stance"),
  takeaway: text("takeaway"),
  abstract: text("abstract"),
  methodology: text("methodology"),
  sampleSize: text("sample_size"),
  studyType: text("study_type"),
  url: text("url"),
  searchQuery: text("search_query"),
  savedAt: text("saved_at").notNull(),
  notes: text("notes"),
});

export const insertSearchSchema = createInsertSchema(searches).omit({ id: true });
export const insertSavedPaperSchema = createInsertSchema(savedPapers).omit({ id: true });

export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searches.$inferSelect;
export type InsertSavedPaper = z.infer<typeof insertSavedPaperSchema>;
export type SavedPaper = typeof savedPapers.$inferSelect;

// API types
export const searchRequestSchema = z.object({
  query: z.string().min(1),
  searchType: z.enum(["question", "topic", "author", "method"]).default("question"),
  yearRange: z.object({
    from: z.number().optional(),
    to: z.number().optional(),
  }).optional(),
  studyTypes: z.array(z.string()).optional(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

export interface PaperResult {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citations: number;
  stance: "yes" | "possibly" | "no";
  takeaway: string;
  abstract: string;
  methodology: string;
  sampleSize: string;
  studyType: string;
  url: string;
}

export interface SearchResult {
  summary: string;
  consensusMeter: {
    yes: number;
    possibly: number;
    no: number;
    totalPapers: number;
  };
  papers: PaperResult[];
  keyFindings: Array<{ text: string; confidence: "high" | "medium" | "low" }>;
  conclusion: string;
  relatedQueries?: string[];
  cached?: boolean;
}

export interface AskPaperRequest {
  paperTitle: string;
  paperAuthors: string;
  paperJournal: string;
  paperTakeaway: string;
  question: string;
}
