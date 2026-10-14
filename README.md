# Úp Bài

Game đấu bài 1v1 chạy trên trình duyệt. Giao diện và game là website tĩnh; hai người kết nối trực tiếp qua WebRTC bằng PeerJS.

## Chạy thử

Mở `index.html` bằng một máy chủ web tĩnh, ví dụ VS Code Live Server. Người tạo phòng bấm **Tạo phòng**, sau đó **Sao chép link** và gửi cho người còn lại. Cả hai cần internet và cho phép kết nối đến dịch vụ PeerJS. Để chơi từ xa, hãy bật GitHub Pages cho nhánh/repo chứa các file này rồi gửi link GitHub Pages.

## Luật hiện có

- Mỗi bên có bộ 24 lá mẫu riêng; bắt đầu với 5 lá và 10 máu.
- Đồng xu chọn người đi trước. Người chơi đến lượt rút 2 lá; không đủ 2 lá để rút thì ván hòa.
- Mỗi lượt chọn tối đa 1 lá sát thương và 1 lá hiệu ứng, trong 20 giây.
- Về 0 máu là thua. Lá trên tay đối thủ được giữ kín; lá đã đánh được lật lên.
- Các hiệu ứng hiện dùng tên/lá mẫu để minh họa và được định nghĩa trong `CARD_SET` ở `game.js`, để thay hoặc cân bằng sau.

## Triển khai và lưu ý

GitHub Pages chỉ phục vụ file tĩnh, nên bản này không cần máy chủ game riêng. PeerJS Cloud được dùng làm dịch vụ báo hiệu WebRTC; chất lượng kết nối phụ thuộc mạng hai người chơi và dịch vụ báo hiệu. Kết nối ngang hàng không thay thế xác thực/chống gian lận của máy chủ: phù hợp bản thử nghiệm bạn bè, chưa phù hợp giải đấu hoặc môi trường có vật phẩm/tiền thật.

Chỉ có chủ phòng điều khiển trạng thái chung và xử lý lượt nhận từ đối thủ. Mỗi máy tự xáo bộ bài của mình; bài trên tay không được gửi sang máy kia. Nếu đóng tab hoặc mất kết nối, cần tạo phòng mới.
