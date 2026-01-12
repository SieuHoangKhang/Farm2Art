import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types/listing";
import { formatVnd } from "@/lib/utils/format";

function TypeBadge({ type }: { type: Listing["type"] }) {
  const label = type === "byproduct" ? "Phế phẩm" : "Farm2Art";
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
      {label}
    </span>
  );
}

function MediaPlaceholder({ title, imageUrl }: { title: string; imageUrl?: string }) {
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl border-b border-stone-200 bg-gradient-to-br from-emerald-900/10 via-emerald-900/5 to-emerald-900/10">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      ) : (
        <div className="absolute inset-0" />
      )}
      <div className="absolute left-4 top-4">
        <span className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200">
          {imageUrl ? "Ảnh" : "Ảnh mẫu"}
        </span>
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-sm font-semibold text-white">
          {initials || "FA"}
        </div>
      </div>
    </div>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const qty = listing.quantity != null ? `${listing.quantity.toLocaleString("vi-VN")} ${listing.unit ?? ""}`.trim() : null;
  const firstImage = listing.images?.[0];
  const imageUrl = typeof firstImage === 'object' && firstImage !== null ? firstImage.secureUrl : firstImage;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <MediaPlaceholder title={listing.title} imageUrl={imageUrl} />
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <TypeBadge type={listing.type} />
          <div className="text-sm font-semibold text-stone-900">{formatVnd(listing.price)}</div>
        </div>

        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-stone-900 group-hover:underline">
            {listing.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{listing.description ?? ""}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1">{listing.location ?? ""}</span>
          {qty ? <span className="rounded-full bg-emerald-50 px-2 py-1 ring-1 ring-stone-200">{qty}</span> : null}
        </div>
      </div>
    </Link>
  );
}
