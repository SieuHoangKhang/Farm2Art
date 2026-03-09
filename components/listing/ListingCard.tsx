import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types/listing";
import { formatVnd } from "@/lib/utils/format";

function TypeBadge({ type }: { type: Listing["type"] }) {
  const label = type === "byproduct" ? "Phế phẩm" : type === "fertilizer" ? "Phân bón" : "Thủ công";
  const colorClass = type === "byproduct" 
    ? "bg-emerald-100/90 text-emerald-700 border-emerald-200/60" 
    : type === "fertilizer"
    ? "bg-blue-100/90 text-blue-700 border-blue-200/60"
    : "bg-amber-100/90 text-amber-700 border-amber-200/60";
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${colorClass}`}>
      {label}
    </span>
  );
}

function MediaPlaceholder({ title, imageUrl, type }: { title: string; imageUrl?: string; type: Listing["type"] }) {
  const initials = title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-sage-50">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-100/60 to-sage-50">
          <div className="text-center">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/90 text-sm font-bold text-white shadow-md">
              {initials || "F2A"}
            </div>
          </div>
        </div>
      )}
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Type Badge */}
      <div className="absolute left-3 top-3 z-10">
        <TypeBadge type={type} />
      </div>
    </div>
  );
}

export function ListingCard({ listing }: { listing: Listing }) {
  const qty = listing.quantity != null ? `${listing.quantity.toLocaleString("vi-VN")} ${listing.unit ?? ""}`.trim() : null;
  const firstImage = listing.images?.[0];
  const rawUrl = typeof firstImage === 'object' && firstImage !== null ? (firstImage as any).secureUrl : (firstImage as any);
  const imageUrl: string | undefined = (rawUrl && typeof rawUrl === 'string' && rawUrl.trim() !== '') ? rawUrl : undefined;

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-2xl border border-sage-200/70 bg-white hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300"
    >
      <MediaPlaceholder title={listing.title} imageUrl={imageUrl} type={listing.type} />
      
      <div className="p-3.5 space-y-2">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold text-stone-800 group-hover:text-emerald-700 transition-colors leading-snug">
          {listing.title}
        </h3>

        {/* Description */}
        {listing.description && (
          <p className="line-clamp-2 text-xs text-stone-400 leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* Price */}
        <div className="pt-1">
          <span className="text-lg font-extrabold text-emerald-700">
            {formatVnd(listing.price)}
          </span>
        </div>

        {/* Location & Quantity */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-sage-100">
          {listing.location && (
            <span className="inline-flex items-center gap-1 text-xs text-stone-500">
              {listing.location}
            </span>
          )}
          {qty && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
              {qty}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
