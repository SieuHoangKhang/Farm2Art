import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { HeaderAuthControls } from "@/components/ui/HeaderAuthControls";
import { LogoImage } from "@/components/ui/LogoImage";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
            <span className="relative h-9 w-9 overflow-hidden rounded-md ring-1 ring-stone-200">
              <LogoImage className="object-cover" />
            </span>
            <span className="tracking-tight">Farm2Art</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/search"
              className="hidden rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-stone-900 md:inline-flex"
            >
              Khám phá
            </Link>
            <Link
              href="/news"
              className="hidden rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-stone-900 md:inline-flex"
            >
              Tin tức
            </Link>
            <Link
              href="/about"
              className="hidden rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-stone-900 md:inline-flex"
            >
              Về chúng tôi
            </Link>
            <Link
              href="/about#lien-he"
              className="hidden rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-stone-900 md:inline-flex"
            >
              Liên hệ
            </Link>
            <HeaderAuthControls />
            <LinkButton href="/register" variant="primary" className="hidden sm:inline-flex">
              Bắt đầu đăng bán
            </LinkButton>
            <LinkButton href="/register" variant="primary" className="sm:hidden">
              Đăng ký
            </LinkButton>
          </nav>
        </div>
      </Container>
    </header>
  );
}
