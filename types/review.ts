export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5 stars
  title: string;
  comment: string;
  images?: string[]; // cloudinary URLs
  helpfulCount: number;
  unhelpfulCount: number;
  verified: boolean; // Bought this product
  createdAt: number;
  updatedAt: number;
  approved: boolean; // Admin moderation
}

export interface ProductRating {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
