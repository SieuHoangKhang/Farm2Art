import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PolicyPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Chính sách"
                subtitle="Các chính sách và quy định của Farm2Art"
            />

            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-stone-900 mb-3">1. Chính sách bảo mật</h2>
                    <div className="space-y-2 text-sm text-stone-700">
                        <p>
                            Farm2Art cam kết bảo vệ thông tin cá nhân của người dùng. Chúng tôi chỉ thu thập
                            những thông tin cần thiết cho việc cung cấp dịch vụ và không chia sẻ với bên thứ ba
                            nếu không có sự đồng ý của bạn.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Thông tin cá nhân được mã hóa và lưu trữ an toàn.</li>
                            <li>Bạn có quyền yêu cầu xóa dữ liệu cá nhân bất cứ lúc nào.</li>
                            <li>Chúng tôi sử dụng Firebase Authentication để xác thực danh tính người dùng.</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-stone-900 mb-3">2. Chính sách mua bán</h2>
                    <div className="space-y-2 text-sm text-stone-700">
                        <p>
                            Mọi giao dịch trên Farm2Art đều phải tuân thủ quy định pháp luật Việt Nam.
                            Người bán chịu trách nhiệm về chất lượng sản phẩm đăng bán.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Sản phẩm đăng bán phải có mô tả chính xác, trung thực.</li>
                            <li>Giá cả phải được niêm yết rõ ràng bằng đơn vị VNĐ.</li>
                            <li>Không được đăng bán các sản phẩm bị cấm theo quy định pháp luật.</li>
                            <li>Người mua có quyền kiểm tra hàng trước khi nhận.</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-stone-900 mb-3">3. Chính sách đổi trả</h2>
                    <div className="space-y-2 text-sm text-stone-700">
                        <p>
                            Farm2Art hỗ trợ đổi trả sản phẩm trong các trường hợp sau:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển.</li>
                            <li>Sản phẩm không đúng mô tả hoặc chất lượng so với đăng tải.</li>
                            <li>Sản phẩm bị thiếu so với đơn hàng.</li>
                        </ul>
                        <p className="mt-2">
                            <strong>Thời hạn đổi trả:</strong> Trong vòng 7 ngày kể từ ngày nhận hàng.
                            Vui lòng liên hệ người bán hoặc bộ phận hỗ trợ để được xử lý.
                        </p>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-stone-900 mb-3">4. Chính sách vận chuyển</h2>
                    <div className="space-y-2 text-sm text-stone-700">
                        <p>
                            Phí vận chuyển được tính dựa trên khoảng cách và khối lượng đơn hàng.
                            Người mua và người bán có thể thỏa thuận phương thức vận chuyển phù hợp.
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Hỗ trợ nhiều đơn vị vận chuyển: GHN, GHTK, Viettel Post.</li>
                            <li>Theo dõi trạng thái đơn hàng theo thời gian thực.</li>
                            <li>Thời gian giao hàng dự kiến: 2-5 ngày làm việc (tùy khu vực).</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-stone-900 mb-3">5. Điều khoản sử dụng</h2>
                    <div className="space-y-2 text-sm text-stone-700">
                        <p>
                            Bằng việc sử dụng Farm2Art, bạn đồng ý tuân thủ các điều khoản sau:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Không sử dụng nền tảng cho các mục đích bất hợp pháp.</li>
                            <li>Không đăng tải nội dung vi phạm quyền sở hữu trí tuệ.</li>
                            <li>Tôn trọng các thành viên khác trong cộng đồng.</li>
                            <li>Farm2Art có quyền tạm khóa hoặc xóa tài khoản vi phạm.</li>
                        </ul>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
