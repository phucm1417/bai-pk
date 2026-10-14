/*
 * Danh sách lá bài và dữ liệu hiệu ứng.
 * Chỉnh sửa tên, mô tả, hình (emoji), nhãn hiển thị và effect tại đây.
 * id như c1 chỉ là mã nội bộ để phân loại/tham chiếu, không hiện trên lá bài.
 * Các effect.type hiện được game hiểu: damage, heal, shield, boost,
 * damage_opponent, weaken, cleanse, heal_and_damage, pig_charge.
 */
window.GAME_CARDS = [
  { id: 'c1', type: 'damage', name: 'Con heo ủn ỉn', emoji: '🐖', text: 'Hết lượt, heo nhảy sang sân đối phương và húc đầu vào nhân vật, gây 1 sát thương.', power: '−1', effect: { type: 'pig_charge', amount: 1 } },
  { id: 'c2', type: 'damage', name: 'Gối ôm phản công', emoji: '🛏️', text: 'Êm ái nhưng trúng đau.', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c3', type: 'damage', name: 'Mưa dép tổ ong', emoji: '🩴', text: 'Dép bay có tổ chức.', power: '3', effect: { type: 'damage', amount: 3 } },
  { id: 'c4', type: 'damage', name: 'Kẹo dẻo bật nảy', emoji: '🍡', text: 'Dính một phát, đau hai nhịp.', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c5', type: 'damage', name: 'Vịt cao su giận dữ', emoji: '🦆', text: 'Quạc! Ai cho tắm trước?', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c6', type: 'damage', name: 'Cà tím vũ trụ', emoji: '🍆', text: 'Đường bay không ai đoán được.', power: '3', effect: { type: 'damage', amount: 3 } },
  { id: 'c7', type: 'damage', name: 'Nụ cười sát thương', emoji: '😁', text: 'Cười xong mới thấy đau.', power: '1', effect: { type: 'damage', amount: 1 } },
  { id: 'c8', type: 'damage', name: 'Bánh kem úp mặt', emoji: '🎂', text: 'Chúc mừng sinh nhật nhé!', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c9', type: 'damage', name: 'Tất thối huyền thoại', emoji: '🧦', text: 'Đòn đánh có mùi rất riêng.', power: '3', effect: { type: 'damage', amount: 3 } },
  { id: 'c10', type: 'damage', name: 'Cú chọc lét', emoji: '🪶', text: 'Không nhịn được đâu!', power: '1', effect: { type: 'damage', amount: 1 } },
  { id: 'c11', type: 'damage', name: 'Trà sữa lắc mạnh', emoji: '🧋', text: 'Trân châu bay tứ tung.', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c12', type: 'damage', name: 'Cục bông thần tốc', emoji: '☁️', text: 'Nhìn mềm, đập khá đau.', power: '2', effect: { type: 'damage', amount: 2 } },
  { id: 'c13', type: 'effect', name: 'Trà đào hồi sức', emoji: '🍑', text: 'Hồi 2 máu.', power: '+2', effect: { type: 'heal', amount: 2 } },
  { id: 'c14', type: 'effect', name: 'Ôm một cái', emoji: '🫂', text: 'Hồi 1 máu và thấy đời tươi.', power: '+1', effect: { type: 'heal', amount: 1 } },
  { id: 'c15', type: 'effect', name: 'Khiên nắp nồi', emoji: '🍳', text: 'Chặn 2 sát thương kế tiếp.', power: 'KHIÊN', effect: { type: 'shield', amount: 2 } },
  { id: 'c16', type: 'effect', name: 'Bùa may mắn', emoji: '🍀', text: 'Đòn kế tiếp mạnh thêm 1.', power: '+1', effect: { type: 'boost', amount: 1 } },
  { id: 'c17', type: 'effect', name: 'Mèo làm phân tâm', emoji: '🐈', text: 'Đối thủ mất 1 máu vì mải ngắm.', power: '−1', effect: { type: 'damage_opponent', amount: 1 } },
  { id: 'c18', type: 'effect', name: 'Chanh chua bất ngờ', emoji: '🍋', text: 'Đối thủ yếu đi: đòn kế tiếp −1.', power: '−1', effect: { type: 'weaken', amount: 1 } },
  { id: 'c19', type: 'effect', name: 'Đổi gió', emoji: '🌬️', text: 'Xóa hiệu ứng xấu của bạn.', power: 'GỠ', effect: { type: 'cleanse' } },
  { id: 'c20', type: 'effect', name: 'Bánh quy chia đôi', emoji: '🍪', text: 'Hồi 1 máu, đối thủ cũng đói.', power: '+1/−1', effect: { type: 'heal_and_damage', heal: 1, damage: 1 } },
  { id: 'c21', type: 'effect', name: 'Áo mưa phép thuật', emoji: '🌧️', text: 'Chặn 1 sát thương kế tiếp.', power: 'KHIÊN', effect: { type: 'shield', amount: 1 } },
  { id: 'c22', type: 'effect', name: 'Pháo giấy', emoji: '🎉', text: 'Đối thủ mất 1 máu. Tiệc mà!', power: '−1', effect: { type: 'damage_opponent', amount: 1 } },
  { id: 'c23', type: 'effect', name: 'Nước tăng lực', emoji: '⚡', text: 'Đòn kế tiếp mạnh thêm 1.', power: '+1', effect: { type: 'boost', amount: 1 } },
  { id: 'c24', type: 'effect', name: 'Gửi tim', emoji: '💌', text: 'Hồi 2 máu. Không cần lý do.', power: '+2', effect: { type: 'heal', amount: 2 } }
];

