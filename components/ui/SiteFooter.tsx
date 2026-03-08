import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

      {/* Main Footer */}
      <div className="bg-gradient-to-b from-emerald-900 via-emerald-950 to-stone-950 text-white">
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 pattern-dots opacity-20 pointer-events-none" />

        <Container>
          <div className="relative grid gap-10 py-16 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 relative rounded-xl overflow-hidden ring-2 ring-emerald-400/30">
                  <Image
                    src="/images/logo.png"
                    alt="Farm2Art Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-xl font-extrabold bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
                  Farm2Art
                </p>
              </div>
              <p className="text-sm text-emerald-200/70 leading-relaxed max-w-xs">
                Kết nối nông dân với nghệ nhân thủ công. Biến phế phẩm nông nghiệp thành sản phẩm giá trị.
              </p>
            </div>

            {/* Links Columns */}
            {[
              {
                title: "Hỗ trợ",
                links: [
                  { href: "/policy", label: "Chính sách" },
                  { href: "/about#lien-he", label: "Liên hệ" },
                  { href: "/about", label: "FAQ" },
                ],
              },
              {
                title: "Khám phá",
                links: [
                  { href: "/search", label: "Tìm kiếm sản phẩm" },
                  { href: "/news", label: "Tin tức & Blog" },
                  { href: "/about", label: "Về Farm2Art" },
                ],
              },
              {
                title: "Tài khoản",
                links: [
                  { href: "/login", label: "Đăng nhập" },
                  { href: "/register", label: "Tạo tài khoản" },
                  { href: "/account", label: "Quản lý tài khoản" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="font-bold text-emerald-300 text-sm uppercase tracking-wider mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-emerald-100/60 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>

        {/* Bottom */}
        <div className="border-t border-emerald-800/50">
          <Container>
            <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-emerald-200/40">
                © {currentYear} Farm2Art. Tất cả quyền được bảo lưu.
              </p>
              <p className="text-xs text-emerald-200/40">
                 Trao giá trị mới cho phụ phẩm nông nghiệp
              </p>
            </div>
          </Container>
        </div>
      </div>
    </footer>
  );
}
