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
  sellerVerified?: boolean;
  accountStatus?: "active" | "suspended";
  riskLevel?: "low" | "medium" | "high";
  strikeCount?: number;
  fraudNote?: string;
  payoutAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    updatedAt?: number;
  };
  createdAt: number;
};
