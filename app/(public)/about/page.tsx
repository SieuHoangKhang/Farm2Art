import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AboutPage() {
  return (
    <div className="space-y-12 pb-12 animate-fadeIn">
      <PageHeader
        title="Về chúng tôi"
        subtitle="Farm2Art kết nối phế phẩm nông nghiệp với nhu cầu tái chế và nghệ thuật, hướng tới chuỗi giá trị xanh và bền vững."
      />

      {/* ===== Người sáng lập ===== */}
      <section className="mx-auto max-w-4xl px-4 animate-fadeInUp">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-[2px] overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-300/20 blur-3xl" />
          
          <div className="relative rounded-[calc(1.5rem-2px)] bg-white p-8 md:p-10">
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="relative h-40 w-40 md:h-48 md:w-48 rounded-full bg-gradient-to-br from-emerald-400 to-amber-400 p-1">
                  <img
                    src="/images/khang.jpg"
                    alt="Trần Siêu Hoàng Khang"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-1 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Người sáng lập
                </div>
                <h2 className="mt-2 text-3xl font-bold text-stone-900">
                  Trần Siêu Hoàng Khang
                </h2>
                <p className="mt-1 text-lg font-medium text-emerald-600">
                  Founder & Developer
                </p>

                <div className="mt-5 space-y-3 text-stone-600 leading-relaxed">
                  <p>
                    Là sinh viên ngành Công nghệ Thông tin với niềm đam mê ứng dụng công nghệ
                    vào giải quyết các vấn đề thực tế, Khang đã sáng tạo nên Farm2Art — một nền tảng
                    kết nối phế phẩm nông nghiệp với nhu cầu tái chế và nghệ thuật thủ công.
                  </p>
                  <p>
                    Xuất phát từ thực trạng lãng phí nguồn phế phẩm nông nghiệp tại Việt Nam,
                    Khang nhận ra tiềm năng to lớn khi những nguyên liệu tưởng chừng bỏ đi
                    có thể trở thành tác phẩm nghệ thuật và sản phẩm giá trị. Farm2Art ra đời
                    với sứ mệnh tạo một cầu nối minh bạch giữa nông dân và các nghệ nhân thủ công.
                  </p>
                  <p>
                    Dự án được xây dựng hoàn toàn bằng các công nghệ hiện đại: Next.js, React,
                    TypeScript, Firebase và Tailwind CSS — thể hiện sự kết hợp giữa kỹ năng
                    lập trình và tư duy giải quyết vấn đề xã hội.
                  </p>
                </div>

                {/* Tech badges */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
                  {["Next.js", "React", "TypeScript", "Firebase", "Tailwind CSS"].map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-sage-200 bg-sage-50 px-3 py-1 text-xs font-medium text-stone-600"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sứ mệnh / Tầm nhìn / Giá trị ===== */}
      <section className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Cam kết</span>
          <h2 className="mt-1 text-2xl font-extrabold text-stone-800">Giá trị cốt lõi</h2>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardBody>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                
              </div>
              <p className="text-base font-semibold text-stone-900">Sứ mệnh</p>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Giảm lãng phí tài nguyên bằng cách đưa phế phẩm nông nghiệp vào chuỗi cung ứng tái chế và sáng tạo.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                🔭
              </div>
              <p className="text-base font-semibold text-stone-900">Tầm nhìn</p>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Trở thành nền tảng giao dịch minh bạch cho nguồn nguyên liệu xanh và các sản phẩm tái chế chất lượng.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sage-100 text-2xl">
                🤝
              </div>
              <p className="text-base font-semibold text-stone-900">Giá trị</p>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                Minh bạch, tin cậy, tối ưu chi phí và ưu tiên tác động tích cực đến môi trường.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ===== Farm2Art hoạt động như thế nào? ===== */}
      <section className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Quy trình</span>
          <h2 className="mt-1 text-2xl font-extrabold text-stone-800">Farm2Art hoạt động như thế nào?</h2>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="hover-lift rounded-2xl border border-sage-200/60 bg-gradient-to-br from-emerald-50 to-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white shadow-md">
              1
            </div>
            <p className="text-base font-bold text-stone-800">Đăng tin</p>
            <p className="mt-2 text-sm text-stone-600">
              Người bán đăng phế phẩm hoặc sản phẩm tái chế kèm ảnh và thông tin chi tiết.
            </p>
          </div>
          <div className="hover-lift rounded-2xl border border-sage-200/60 bg-gradient-to-br from-amber-50 to-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-xl font-bold text-white shadow-md">
              2
            </div>
            <p className="text-base font-bold text-stone-800">Trao đổi</p>
            <p className="mt-2 text-sm text-stone-600">
              Người mua chat để chốt số lượng, địa điểm và cách vận chuyển phù hợp.
            </p>
          </div>
          <div className="hover-lift rounded-2xl border border-sage-200/60 bg-gradient-to-br from-sage-50 to-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-600 to-stone-700 text-xl font-bold text-white shadow-md">
              3
            </div>
            <p className="text-base font-bold text-stone-800">Giao dịch</p>
            <p className="mt-2 text-sm text-stone-600">
              Tạo đơn hàng và thanh toán an toàn qua nền tảng Farm2Art.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Liên hệ ===== */}
      <section id="lien-he" className="mx-auto max-w-4xl px-4">
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-8 text-center relative">
          <div className="absolute inset-0 pattern-dots opacity-10" />
          <div className="relative">
            <h2 className="text-xl font-bold text-white">Liên hệ</h2>
            <p className="mt-4 text-sm text-emerald-100/80">
               Email: <span className="font-semibold text-white">support@farm2art.vn</span>
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
               Hotline: <span className="font-semibold text-white">1900 0000</span>
            </p>
            <p className="mt-5 text-xs text-emerald-200/50">
              Farm2Art — Trao giá trị mới cho phụ phẩm nông nghiệp 
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
