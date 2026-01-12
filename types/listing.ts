export type ListingType = "byproduct" | "art";

export type ListingImage = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
};

export type Listing = {
  id: string;
  type: ListingType;
  title: string;
  description?: string;
  price: number;
  quantity?: number;
  unit?: string;
  location?: string;
  sellerId: string;
  ownerId?: string;
  images: ListingImage[] | string[];
  status: "draft" | "active" | "hidden" | "inactive";
  createdAt: number;
};
