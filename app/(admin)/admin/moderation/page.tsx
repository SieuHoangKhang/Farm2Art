import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function ModerationPage() {
  return (
    <div>
      <PageHeader title="Duyệt tin" subtitle="Kiểm duyệt và ẩn bài đăng vi phạm." />
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600">TODO: danh sách pending + nút duyệt/ẩn.</p>
        </CardBody>
      </Card>
    </div>
  );
}
