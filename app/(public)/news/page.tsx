import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { NEWS } from "@/lib/mock/news";

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tức"
        subtitle="Cập nhật hoạt động, hướng dẫn sử dụng và các khuyến nghị giao dịch an toàn (demo nội dung)."
      />

      <div className="grid gap-4">
        {NEWS.map((item) => (
          <Card key={item.slug}>
            <CardBody>
              <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
                <Link href={`/news/${item.slug}`} className="text-base font-semibold text-stone-900 hover:underline">
                  {item.title}
                </Link>
                <span className="text-xs text-stone-500">{new Date(item.date).toLocaleDateString("vi-VN")}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{item.excerpt}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
