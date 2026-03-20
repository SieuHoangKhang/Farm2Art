import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAdminDb } from "@/lib/firebase/admin";
import type { NewsArticle } from "@/types/news";

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const snapshot = await getAdminDb()
    .collection("news")
    .where("status", "==", "published")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  const item = snapshot.docs[0]
    ? ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as NewsArticle)
    : null;

  if (!item) notFound();

  return (
    <div className="py-10">
      <Container>
        <div className="mb-6">
          <Link href="/news" className="text-sm text-stone-600 hover:underline">
            ← Quay lại Tin tức
          </Link>
        </div>

        <PageHeader
          title={item.title}
          subtitle={new Date(item.publishedAt || item.date || item.createdAt).toLocaleDateString("vi-VN")}
        />

        <Card>
          <CardBody>
            <p className="text-sm text-stone-700">{item.excerpt}</p>

            <div className="mt-6 whitespace-pre-line text-sm leading-6 text-stone-700">
              {item.content}
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
