export interface RecentDoc {
  name: string;
  size: number;
  lastOpened: number;
  format: 'hwp' | 'hwpx' | 'hml';
}

const STORAGE_KEY = 'rhwp_studio_recent_docs';

export class HistoryStore {
  static getRecentDocs(): RecentDoc[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addRecentDoc(name: string, size: number): void {
    try {
      const docs = this.getRecentDocs().filter((d) => d.name !== name);
      const ext = name.split('.').pop()?.toLowerCase();
      const format = ext === 'hwpx' ? 'hwpx' : ext === 'hml' ? 'hml' : 'hwp';

      docs.unshift({
        name,
        size,
        lastOpened: Date.now(),
        format,
      });

      // Keep up to 10 items
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.slice(0, 10)));
    } catch {
      // Ignore localStorage failure
    }
  }
}
