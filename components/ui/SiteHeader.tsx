import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { HeaderAuthControls } from "@/components/ui/HeaderAuthControls";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm">
      <Container>
        <div className="h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2.5 font-bold text-emerald-700 hover:text-emerald-800 transition-colors flex-shrink-0">
            <div className="h-10 w-10 relative rounded-xl overflow-hidden ring-2 ring-emerald-100 group-hover:ring-emerald-200 transition-all group-hover:shadow-glow">
              <Image
                src="/images/logo.png"
                alt="Farm2Art Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-extrabold hidden sm:inline bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">
              Farm2Art
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <div className="hidden md:flex items-center gap-0.5">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/search", label: "Sản phẩm" },
                { href: "/news", label: "Tin tức" },
                { href: "/policy", label: "Chính sách" },
                { href: "/about", label: "Về chúng tôi" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="relative px-3.5 py-2 text-sm font-medium text-stone-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50/70 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="w-px h-6 bg-sage-200 mx-2 hidden md:block" />

            {/* Auth Controls */}
            <HeaderAuthControls />
          </nav>
        </div>
      </Container>
    </header>
  );
}
