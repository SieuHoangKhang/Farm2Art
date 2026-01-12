import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardBody } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getNewsBySlug, NEWS } from "@/lib/mock/news";

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = params as unknown as { slug: string };
  const item = getNewsBySlug(slug);

  if (!item) notFound();

  return (
    <div className="py-10">
      <Container>
        <div className="mb-6">
          <Link href="/news" className="text-sm text-stone-600 hover:underline">
            ← Quay lại Tin tức
          </Link>
        </div>

        <PageHeader title={item.title} subtitle={new Date(item.date).toLocaleDateString("vi-VN")} />

        <Card>
          <CardBody>
            <p className="text-sm text-stone-700">{item.excerpt}</p>

            <div className="mt-6 space-y-6">
              {item.content.map((section) => (
                <section key={section.heading} className="space-y-2">
                  <h2 className="text-base font-semibold text-stone-900">{section.heading}</h2>
                  <p className="text-sm leading-6 text-stone-700">{section.body}</p>
                </section>
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
