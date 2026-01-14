export interface WishlistItem {
  productId: string;
  addedAt: number;
  priceWhenAdded: number;
  notifyOnDiscount?: boolean;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  createdAt: number;
  updatedAt: number;
}
