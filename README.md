# Úp Bài

Game đấu bài 1v1 chạy trên trình duyệt. Giao diện và game là website tĩnh; hai người kết nối trực tiếp qua WebRTC bằng PeerJS.

## Chạy thử

Mở `index.html` bằng một máy chủ web tĩnh, ví dụ VS Code Live Server. Người tạo phòng bấm **Tạo phòng**, sau đó **Sao chép link** và gửi cho người còn lại. Cả hai cần internet và cho phép kết nối đến dịch vụ PeerJS. Để chơi từ xa, hãy bật GitHub Pages cho nhánh/repo chứa các file này rồi gửi link GitHub Pages.

## Luật hiện có

- Mỗi bên có bộ 24 lá mẫu riêng; bắt đầu với 5 lá và 10 máu.
- Đồng xu chọn người đi trước. Sau mỗi lượt, cả hai cùng rút 1 lá. Khi bộ bài cạn, xáo chồng bài bỏ để tiếp tục; trận chỉ kết thúc khi máu của một bên về 0.
- Mỗi lượt chỉ được đánh 1 lá: chọn lá sát thương hoặc lá hiệu ứng, trong 60 giây.
- Về 0 máu là thua. Lá trên tay đối thủ được giữ kín; lá đã đánh được lật lên.
- Lá đã đánh bay vào chồng bài bỏ. Khi bộ bài rút cạn, chồng bài bỏ được xáo lại thành bộ bài mới.
- Chọn màu nhân vật của bạn trong phần tùy chỉnh ở sảnh chờ. Khi bị trúng đòn, nhân vật giật lùi, tim nháy đỏ và sát thương hiện lên.
- Mở **Thư viện bài** ở sảnh để xem đủ 24 lá. Chạm vào một lá để thử nhanh hiệu ứng trên bàn mô phỏng; nút **Về sảnh** trong trận giúp rời phòng và quay lại sảnh.
- Lá `c1`, **Con heo ủn ỉn**, nhảy sang sân đối thủ rồi húc đầu vào nhân vật để gây 1 sát thương.
- Chỉnh danh sách lá, tên, mô tả và dữ liệu hiệu ứng trong `cards.js`. ID như `c1` chỉ là mã nội bộ, không hiển thị trên lá. Các loại hiệu ứng được game hỗ trợ được ghi chú ở đầu file.

## Triển khai và lưu ý

GitHub Pages chỉ phục vụ file tĩnh, nên bản này không cần máy chủ game riêng. PeerJS Cloud được dùng làm dịch vụ báo hiệu WebRTC; chất lượng kết nối phụ thuộc mạng hai người chơi và dịch vụ báo hiệu. Kết nối ngang hàng không thay thế xác thực/chống gian lận của máy chủ: phù hợp bản thử nghiệm bạn bè, chưa phù hợp giải đấu hoặc môi trường có vật phẩm/tiền thật.

Chỉ có chủ phòng điều khiển trạng thái chung và xử lý lượt nhận từ đối thủ. Mỗi máy tự xáo bộ bài của mình; bài trên tay không được gửi sang máy kia. Nếu đóng tab hoặc mất kết nối, cần tạo phòng mới.

