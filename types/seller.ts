export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'none';

export interface SellerVerification {
  sellerId: string;
  status: VerificationStatus;
  businessName: string;
  businessRegistration: string; // File URL
  ownerName: string;
  ownerID: string; // ID card/passport file URL
  bankAccount: string;
  bankName: string;
  businessAddress: string;
  phone: string;
  email: string;
  documentSubmittedAt?: number;
  approvedAt?: number;
  rejectionReason?: string;
  verificationBadge?: boolean; // Show checkmark badge on listing
}
