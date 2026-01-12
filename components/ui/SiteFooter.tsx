import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LogoImage } from "@/components/ui/LogoImage";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <Container>
        <div className="grid gap-8 py-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <span className="relative h-10 w-10 overflow-hidden rounded-md ring-1 ring-stone-200">
                <LogoImage className="object-cover" />
              </span>
              <p className="text-sm font-semibold text-stone-900">Farm2Art</p>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Sàn giao dịch phế phẩm nông nghiệp và sản phẩm nghệ thuật tái chế — giúp tối ưu nguồn nguyên liệu,
              giảm lãng phí và tạo giá trị mới.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-stone-900">Liên kết</p>
            <div className="mt-3 flex flex-col gap-2 text-stone-600">
              <Link href="/about" className="hover:text-stone-900">
                Về chúng tôi
              </Link>
              <Link href="/news" className="hover:text-stone-900">
                Tin tức
              </Link>
              <Link href="/search" className="hover:text-stone-900">
                Khám phá sản phẩm
              </Link>
              <Link href="/login" className="hover:text-stone-900">
                Đăng nhập
              </Link>
              <Link href="/register" className="hover:text-stone-900">
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-200 py-6 text-xs text-stone-500">
          © {new Date().getFullYear()} Farm2Art. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
