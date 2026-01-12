export type UserRole = "user" | "admin";

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
  createdAt: number;
};
