import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Về chúng tôi"
        subtitle="Farm2Art kết nối phế phẩm nông nghiệp với nhu cầu tái chế và nghệ thuật, hướng tới chuỗi giá trị xanh và bền vững."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Sứ mệnh</p>
            <p className="mt-1 text-sm text-stone-600">
              Giảm lãng phí tài nguyên bằng cách đưa phế phẩm nông nghiệp vào chuỗi cung ứng tái chế và sáng tạo.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Tầm nhìn</p>
            <p className="mt-1 text-sm text-stone-600">
              Trở thành nền tảng giao dịch minh bạch cho nguồn nguyên liệu xanh và các sản phẩm tái chế chất lượng.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Giá trị cốt lõi</p>
            <p className="mt-1 text-sm text-stone-600">
              Minh bạch, tin cậy, tối ưu chi phí và ưu tiên tác động tích cực đến môi trường.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-stone-900">Farm2Art hoạt động như thế nào?</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-stone-900">1) Đăng tin</p>
              <p className="mt-1 text-sm text-stone-600">Người bán đăng phế phẩm hoặc sản phẩm tái chế kèm ảnh và thông tin.</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-stone-900">2) Trao đổi</p>
              <p className="mt-1 text-sm text-stone-600">Người mua chat để chốt số lượng, địa điểm, cách vận chuyển.</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-stone-900">3) Giao dịch</p>
              <p className="mt-1 text-sm text-stone-600">Tạo đơn và thanh toán theo hướng dẫn (demo đang hoàn thiện).</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p id="lien-he" className="text-sm font-semibold text-stone-900">Liên hệ</p>
          <p className="mt-1 text-sm text-stone-600">
            Email: support@farm2art.vn (demo) • Hotline: 1900 0000 (demo)
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
