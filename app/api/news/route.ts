import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { NewsArticle } from "@/types/news";

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const snapshot = await adminDb.collection("news").get();
    const allArticles = snapshot.docs.map(
      (articleDoc) => ({ id: articleDoc.id, ...articleDoc.data() }) as NewsArticle
    );
    const publishedArticles = allArticles
      .filter((article) => article.status === "published")
      .sort(
        (left, right) =>
          (right.createdAt || right.publishedAt || right.date || 0) -
          (left.createdAt || left.publishedAt || left.date || 0)
      );

    if (slug) {
      const article = publishedArticles.find((item) => item.slug === slug) || null;

      return NextResponse.json({ article }, { status: 200 });
    }

    return NextResponse.json({ articles: publishedArticles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching public news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch news" },
      { status: 500 }
    );
  }
}