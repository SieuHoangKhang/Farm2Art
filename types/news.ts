export type NewsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Rich text or HTML
  image: string; // Image URL
  date: number; // Timestamp
  publishedAt?: number; // Published timestamp
  createdAt: number;
  updatedAt: number;
  createdBy: string; // Admin ID
  status: "draft" | "published" | "archived";
  category?: string; // Optional category for news
};
