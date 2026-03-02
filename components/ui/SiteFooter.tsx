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
              <div className="mt-5 flex gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800/60 text-emerald-300 hover:bg-emerald-700 transition-colors cursor-pointer">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724 9.864 9.864 0 01-3.127 1.195 4.916 4.916 0 00-8.384 4.482A13.944 13.944 0 011.671 3.149a4.916 4.916 0 001.523 6.574 4.897 4.897 0 01-2.229-.616v.061a4.919 4.919 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 14-7.496 14-13.986 0-.21 0-.423-.015-.634A9.935 9.935 0 0024 4.557z"/></svg>
                </span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800/60 text-emerald-300 hover:bg-emerald-700 transition-colors cursor-pointer">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.828.94z"/></svg>
                </span>
              </div>
            </div>

            {/* Links Columns */}
            {[
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
              {
                title: "Hỗ trợ",
                links: [
                  { href: "/about#lien-he", label: "Liên hệ" },
                  { href: "/about", label: "FAQ" },
                  { href: "/about", label: "Chính sách" },
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
                🌱 Trao giá trị mới cho phụ phẩm nông nghiệp
              </p>
            </div>
          </Container>
        </div>
      </div>
    </footer>
  );
}
