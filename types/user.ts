export type UserRole = "user" | "seller" | "admin";

export type AppUser = {
  uid: string;
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  avatarUrl?: string;
  role: UserRole;
  sellerVerified?: boolean;
  createdAt: number;
};
