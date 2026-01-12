import { LinkButton } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-700 opacity-[0.08]" />
        <div className="relative p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Farm2Art
            </h1>
            <p className="mt-3 text-base text-stone-600">
              Nơi kết nối nguồn phế phẩm nông nghiệp với nhu cầu tái chế và nghệ thuật — minh bạch, tiện lợi,
              và dễ giao dịch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/search" variant="primary">
                Khám phá sản phẩm
              </LinkButton>
              <LinkButton href="/register" variant="secondary">
                Bắt đầu đăng bán
              </LinkButton>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-stone-200 bg-white/70 p-3">
                <p className="text-xs text-stone-500">Danh mục</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Phế phẩm & Art</p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white/70 p-3">
                <p className="text-xs text-stone-500">Giao tiếp</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">Chat realtime</p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-white/70 p-3">
                <p className="text-xs text-stone-500">Thanh toán</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">VNPay</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-stone-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-stone-900">Phế phẩm nông nghiệp</p>
              <p className="mt-1 text-sm text-stone-600">Rơm, trấu, vỏ cà phê, mùn cưa… theo khu vực.</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-stone-900">Sản phẩm nghệ thuật tái chế</p>
              <p className="mt-1 text-sm text-stone-600">Đồ decor, quà tặng, thủ công từ vật liệu tái chế.</p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-stone-900">Quy trình giao dịch</p>
              <p className="mt-1 text-sm text-stone-600">Đăng tin → chat/thoả thuận → đặt hàng → thanh toán.</p>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-stone-900">Tìm phế phẩm</h2>
            <p className="mt-1 text-sm text-stone-600">
              Tìm nguồn nguyên liệu theo loại, số lượng và vị trí.
            </p>
            <div className="mt-4">
              <LinkButton href="/search?type=byproduct" variant="secondary">
                Xem phế phẩm
              </LinkButton>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-stone-900">Khám phá Farm2Art</h2>
            <p className="mt-1 text-sm text-stone-600">
              Xem sản phẩm nghệ thuật tái chế và đặt hàng.
            </p>
            <div className="mt-4">
              <LinkButton href="/search?type=art" variant="secondary">
                Xem sản phẩm tái chế
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-stone-900">Về chúng tôi</h2>
            <p className="mt-1 text-sm text-stone-600">
              Tìm hiểu sứ mệnh, tầm nhìn và cách Farm2Art vận hành.
            </p>
            <div className="mt-4">
              <LinkButton href="/about" variant="secondary">
                Xem giới thiệu
              </LinkButton>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-stone-900">Tin tức</h2>
            <p className="mt-1 text-sm text-stone-600">
              Cập nhật hướng dẫn, thông báo và khuyến nghị giao dịch.
            </p>
            <div className="mt-4">
              <LinkButton href="/news" variant="secondary">
                Xem tin mới
              </LinkButton>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Tối ưu chi phí</p>
            <p className="mt-1 text-sm text-stone-600">Kết nối trực tiếp nguồn phế phẩm theo khu vực.</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Minh bạch</p>
            <p className="mt-1 text-sm text-stone-600">Thông tin rõ ràng: số lượng, giá, tình trạng.</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-semibold text-stone-900">Tạo giá trị xanh</p>
            <p className="mt-1 text-sm text-stone-600">Tái chế thành sản phẩm nghệ thuật và hữu ích.</p>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
