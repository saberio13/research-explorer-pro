import {
  type Search, type InsertSearch, searches,
  type SavedPaper, type InsertSavedPaper, savedPapers,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc, and, gt } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Searches
  createSearch(search: InsertSearch): Promise<Search>;
  getSearches(): Promise<Search[]>;
  getSearchById(id: number): Promise<Search | undefined>;
  deleteSearch(id: number): Promise<void>;
  findCachedSearch(cacheKey: string): Promise<Search | undefined>;

  // Saved papers
  savePaper(paper: InsertSavedPaper): Promise<SavedPaper>;
  getSavedPapers(): Promise<SavedPaper[]>;
  deleteSavedPaper(id: number): Promise<void>;
  isSaved(title: string): Promise<boolean>;
  updatePaperNotes(id: number, notes: string): Promise<SavedPaper>;
}

export class DatabaseStorage implements IStorage {
  async createSearch(search: InsertSearch): Promise<Search> {
    return db.insert(searches).values(search).returning().get();
  }

  async getSearches(): Promise<Search[]> {
    return db.select().from(searches).orderBy(desc(searches.id)).all();
  }

  async getSearchById(id: number): Promise<Search | undefined> {
    return db.select().from(searches).where(eq(searches.id, id)).get();
  }

  async deleteSearch(id: number): Promise<void> {
    db.delete(searches).where(eq(searches.id, id)).run();
  }

  async findCachedSearch(cacheKey: string): Promise<Search | undefined> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return db.select().from(searches)
      .where(and(eq(searches.cacheKey, cacheKey), gt(searches.createdAt, cutoff)))
      .orderBy(desc(searches.id))
      .get();
  }

  async savePaper(paper: InsertSavedPaper): Promise<SavedPaper> {
    return db.insert(savedPapers).values(paper).returning().get();
  }

  async getSavedPapers(): Promise<SavedPaper[]> {
    return db.select().from(savedPapers).orderBy(desc(savedPapers.id)).all();
  }

  async deleteSavedPaper(id: number): Promise<void> {
    db.delete(savedPapers).where(eq(savedPapers.id, id)).run();
  }

  async isSaved(title: string): Promise<boolean> {
    const result = db.select().from(savedPapers).where(eq(savedPapers.title, title)).get();
    return !!result;
  }

  async updatePaperNotes(id: number, notes: string): Promise<SavedPaper> {
    return db.update(savedPapers).set({ notes }).where(eq(savedPapers.id, id)).returning().get();
  }
}

export const storage = new DatabaseStorage();
