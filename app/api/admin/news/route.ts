import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { NewsArticle } from "@/types/news";

// GET - Fetch all news articles
export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status"); // "draft", "published", "archived"

    if (id) {
      const articleDoc = await adminDb.collection("news").doc(id).get();

      if (!articleDoc.exists) {
        return NextResponse.json(
          { error: "Article not found", articles: [] },
          { status: 404 }
        );
      }

      const article = {
        id: articleDoc.id,
        ...articleDoc.data(),
      } as NewsArticle;

      return NextResponse.json({ articles: [article] }, { status: 200 });
    }

    let q = adminDb.collection("news").orderBy("createdAt", "desc");

    if (status) {
      q = adminDb.collection("news").where("status", "==", status).orderBy("createdAt", "desc");
    }

    const snapshot = await q.get();
    const articles = snapshot.docs.map((articleDoc) => ({
      id: articleDoc.id,
      ...articleDoc.data(),
    } as NewsArticle));

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news articles" },
      { status: 500 }
    );
  }
}

// POST - Create new news article
export async function POST(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await request.json();
    const { title, slug, excerpt, content, image, status, category, createdBy, date } = body;

    if (!title || !slug || !excerpt || !content || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newArticle: Omit<NewsArticle, "id"> = {
      title,
      slug,
      excerpt,
      content,
      image: image || "",
      date: date || Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy,
      status: status || "draft",
      category: category || "",
    };

    const docRef = await adminDb.collection("news").add(newArticle);

    return NextResponse.json(
      {
        id: docRef.id,
        ...newArticle,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating news:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create news article" },
      { status: 500 }
    );
  }
}

// PUT - Update news article
export async function PUT(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await request.json();
    const { id, title, slug, excerpt, content, image, status, category, date } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const articleRef = adminDb.collection("news").doc(id);
    const updates = {
      ...(title && { title }),
      ...(slug && { slug }),
      ...(excerpt && { excerpt }),
      ...(content && { content }),
      ...(image && { image }),
      ...(status && { status }),
      ...(category && { category }),
      ...(date && { date }),
      updatedAt: Date.now(),
    };

    await articleRef.update(updates);

    return NextResponse.json(
      { message: "Article updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating news:", error);
    return NextResponse.json(
      { error: "Failed to update news article" },
      { status: 500 }
    );
  }
}

// DELETE - Delete news article
export async function DELETE(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("news").doc(id).delete();

    return NextResponse.json(
      { message: "Article deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news article" },
      { status: 500 }
    );
  }
}
