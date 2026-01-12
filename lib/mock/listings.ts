import type { Listing, ListingType } from "@/types/listing";

function nowMs() {
  return Date.now();
}

export const mockListings: Listing[] = [
  {
    id: "by-001",
    type: "byproduct",
    title: "Rơm khô cuộn (đã phơi)",
    description: "Rơm khô sạch, phù hợp làm nấm/ủ phân. Có thể giao nội thành.",
    price: 120000,
    quantity: 50,
    unit: "cuộn",
    location: "Củ Chi, TP.HCM",
    sellerId: "seller_cuchi",
    ownerId: "seller_cuchi",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: "by-002",
    type: "byproduct",
    title: "Trấu sạch số lượng lớn",
    description: "Trấu đã sàng, phù hợp làm giá thể hoặc đốt lò. Nhận theo bao hoặc theo tấn.",
    price: 3500,
    quantity: 800,
    unit: "kg",
    location: "Cái Bè, Tiền Giang",
    sellerId: "seller_tiengiang",
    ownerId: "seller_tiengiang",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 4,
  },
  {
    id: "by-003",
    type: "byproduct",
    title: "Vỏ cà phê (đã phơi)",
    description: "Vỏ cà phê khô, thích hợp ủ phân hữu cơ. Có sẵn hàng đều.",
    price: 1800,
    quantity: 1500,
    unit: "kg",
    location: "Buôn Ma Thuột, Đắk Lắk",
    sellerId: "seller_daklak",
    ownerId: "seller_daklak",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 6,
  },
  {
    id: "art-001",
    type: "art",
    title: "Đèn trang trí từ tre & giấy tái chế",
    description: "Đèn decor handmade, ánh sáng ấm, phù hợp phòng khách/phòng ngủ.",
    price: 690000,
    quantity: 3,
    unit: "cái",
    location: "Quận 3, TP.HCM",
    sellerId: "artisan_q3",
    ownerId: "artisan_q3",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 1,
  },
  {
    id: "art-002",
    type: "art",
    title: "Tranh collage từ bao bì nông sản",
    description: "Tranh treo tường, chất liệu bao bì/giấy tái chế, phối màu tối giản.",
    price: 450000,
    quantity: 1,
    unit: "bức",
    location: "Thủ Đức, TP.HCM",
    sellerId: "artisan_thuduc",
    ownerId: "artisan_thuduc",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "art-003",
    type: "art",
    title: "Giỏ đựng đồ từ sợi dứa",
    description: "Sợi dứa xử lý thủ công, giỏ bền, nhẹ, phù hợp trang trí và sử dụng hằng ngày.",
    price: 220000,
    quantity: 8,
    unit: "cái",
    location: "Bến Tre",
    sellerId: "artisan_bentre",
    ownerId: "artisan_bentre",
    images: [],
    status: "active",
    createdAt: nowMs() - 1000 * 60 * 60 * 24 * 5,
  },
];

export function getMockListings(type?: ListingType) {
  if (!type) return mockListings;
  return mockListings.filter((l) => l.type === type);
}

export function getMockListingById(id: string) {
  return mockListings.find((l) => l.id === id) ?? null;
}
