# Farm2Art

Sàn giao dịch phế phẩm nông nghiệp và sản phẩm nghệ thuật tái chế.

## Yêu cầu
- Node.js LTS (khuyến nghị 20+)
- Tài khoản Firebase (Auth/Firestore)
- Tài khoản Cloudinary (quản lý ảnh)

## Kết nối Firebase
1) Firebase Console → Project settings → mục "Your apps" → bấm icon Web (</>) để tạo Web App
2) Copy cấu hình Firebase (apiKey, authDomain, projectId, ...) và điền vào `.env.local`
	- Copy file mẫu `.env.local.example` thành `.env.local`
3) Firebase Console → Authentication → bật phương thức Email/Password (hoặc Google)
4) Firebase Console → Firestore Database → Create database

Code khởi tạo:
- Client SDK (Auth/Firestore/Storage): [Farm2Art/lib/firebase/client.ts](Farm2Art/lib/firebase/client.ts)
- Admin SDK (server-only): [Farm2Art/lib/firebase/admin.ts](Farm2Art/lib/firebase/admin.ts)

## Đăng nhập Google & Phone
Firebase Console → Authentication → Sign-in method:
- Bật **Google** (chọn support email nếu được hỏi)
- Bật **Phone** (Web dùng reCAPTCHA; nên dùng số test trong giai đoạn dev để tránh tốn SMS)

## Chạy giao diện (dev)
1) Cài Node.js LTS
2) Mở terminal tại thư mục dự án và chạy:
	- `cd d:\MON_HOC\DO_AN_CS2\Farm2Art`
	- `npm install`
	- `npm run dev`
3) Mở trình duyệt: `http://localhost:3000`

## Ghi chú
Repo này hiện là khung thư mục + file placeholder để bạn bắt đầu đồ án.

## Thanh toán VNPay (khung tích hợp)
- API tạo link thanh toán: `POST /api/payments/vnpay/create`
- API nhận return (người dùng quay về): `GET /api/payments/vnpay/return`
- API IPN (VNPay gọi server-to-server): `GET /api/payments/vnpay/ipn`

Bạn cần điền biến môi trường VNPay trong `.env.local` theo mẫu `.env.local.example`.
