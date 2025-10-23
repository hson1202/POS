# Hướng dẫn Đặt bàn (Table Booking)

## Tổng quan

Hệ thống đặt bàn cho phép nhà hàng nhận đặt bàn trước từ khách hàng và quản lý thông tin booking một cách hiệu quả.

## Tính năng chính

### 1. Đặt bàn mới (Book Table)

#### Cách thực hiện:
1. Vào trang **Bàn** (Tables)
2. Tìm bàn có trạng thái **"Trống"** (Available)
3. Click nút **"Đặt bàn"** ở góc dưới phải của card bàn
4. Điền thông tin đặt bàn:
   - **Tên khách** (bắt buộc)
   - **SĐT khách** (bắt buộc)
   - **Ngày đến** (bắt buộc) - Không cho chọn ngày quá khứ
   - **Giờ đến** (bắt buộc)
   - **Số khách** (chọn từ 1-12)
   - **Ghi chú** (không bắt buộc)
5. Click **"Đặt bàn"** để xác nhận

#### Kết quả:
- Bàn chuyển sang trạng thái **"Đã đặt"** (Booked) với màu cam
- Thông tin khách hiển thị ngay trên card bàn
- Hệ thống tự động lưu thời gian đặt bàn

### 2. Xem thông tin khách đặt bàn

#### Trên card bàn:
- **Tên khách** và **SĐT**
- **Số khách** và **Ngày giờ dự kiến đến** (format: DD/MM HH:mm)

#### Chi tiết trong modal:
1. Click vào bàn đã đặt
2. Xem đầy đủ thông tin:
   - Tên, SĐT khách
   - Số khách
   - **Ngày giờ dự kiến đến** - Thời gian khách dự kiến đến nhà hàng
   - **Thời gian đặt bàn** - Thời gian tạo booking
   - Ghi chú đặc biệt (nếu có)
   - Trạng thái: "Đã đặt - chờ khách đến"

### 3. Khi khách đến (Start Ordering)

#### Cách thực hiện:
1. Click vào bàn đã đặt
2. Trong modal chi tiết, click nút **"Bắt đầu gọi món"**
3. Hệ thống chuyển đến trang Menu
4. Thông tin khách đã được lưu sẵn
5. Bắt đầu nhận order

#### Kết quả:
- Bàn chuyển sang trạng thái **"Đang dùng"** (Occupied) khi đặt món
- Thông tin khách vẫn được giữ nguyên
- Order được gắn với bàn và thông tin khách

### 4. Quản lý trạng thái bàn

#### Các trạng thái:

1. **Trống (Available)** - Màu trắng
   - Bàn sẵn sàng nhận khách
   - Hiển thị nút "Đặt bàn"

2. **Đã đặt (Booked)** - Màu cam
   - Bàn đã được đặt trước
   - Hiển thị thông tin khách đặt
   - Hiển thị nút "Bắt đầu gọi món"

3. **Đang dùng (Occupied)** - Màu xanh
   - Bàn đang có khách
   - Hiển thị thông tin order hiện tại

#### Thay đổi trạng thái:
- Vào modal chi tiết bàn
- Phần "Cập nhật trạng thái bàn"
- Chọn trạng thái mới (Available/Booked/Occupied)

## Quy trình làm việc

### Quy trình đặt bàn hoàn chỉnh:

```
1. Nhận yêu cầu đặt bàn từ khách
   ↓
2. Chọn bàn trống → Click "Đặt bàn"
   ↓
3. Nhập thông tin khách (tên, SĐT, số khách, ghi chú)
   ↓
4. Xác nhận đặt bàn
   ↓
5. Bàn chuyển sang trạng thái "Đã đặt"
   ↓
6. Khi khách đến → Click "Bắt đầu gọi món"
   ↓
7. Nhận order từ khách
   ↓
8. Bàn chuyển sang "Đang dùng"
   ↓
9. Hoàn tất order và thanh toán
   ↓
10. Bàn trở về trạng thái "Trống"
```

## Lưu ý kỹ thuật

### Backend Changes:
1. **Order Model** - Thêm status "Booked" vào enum, thêm field `reservationDateTime`
2. **Table Controller** - Logic tạo order booking với status "Booked", lưu cả bookingTime và reservationDateTime
3. **Order Schema** - Hỗ trợ:
   - `bookingTime`: Thời gian tạo booking (khi nào đặt)
   - `reservationDateTime`: Ngày giờ dự kiến khách đến
   - `notes`: Ghi chú đặc biệt

### Frontend Changes:
1. **TableCard Component** - UI đặt bàn và hiển thị thông tin
2. **Booking Modal** - Form nhập thông tin đặt bàn với:
   - Input chọn ngày (type="date") - min là ngày hôm nay
   - Input chọn giờ (type="time")
   - Validation không cho đặt quá khứ
3. **Detail Modal** - Hiển thị đầy đủ thông tin:
   - Ngày giờ dự kiến đến (reservationDateTime)
   - Thời gian đặt bàn (bookingTime)
4. **PlaceOrder** - Cập nhật status bàn khi đặt món

## Tính năng bổ sung có thể phát triển

1. ✅ **Đặt bàn theo ngày giờ** - Đã hoàn thành
2. **Thông báo nhắc nhở** - Nhắc nhở khi gần giờ booking (push notification)
3. **Lịch sử đặt bàn** - Xem các booking đã qua
4. **Hủy đặt bàn** - Cho phép hủy booking với lý do
5. **Sửa thông tin booking** - Cho phép thay đổi giờ, số khách
6. **Xác nhận qua SMS/Email** - Gửi xác nhận cho khách
7. **Tìm kiếm booking** - Tìm theo tên/SĐT khách
8. **Thống kê booking** - Báo cáo về tình hình đặt bàn
9. **Đặt bàn trước nhiều ngày** - Calendar view để xem booking
10. **Conflict detection** - Cảnh báo khi bàn đã có booking trong khoảng thời gian

## Xử lý lỗi

### Lỗi phổ biến:

1. **"Vui lòng nhập tên khách"**
   - Chưa điền tên khách
   - Giải pháp: Nhập tên khách vào field

2. **"Vui lòng nhập SĐT khách"**
   - Chưa điền số điện thoại
   - Giải pháp: Nhập SĐT vào field

3. **"Vui lòng chọn ngày đến"**
   - Chưa chọn ngày
   - Giải pháp: Chọn ngày từ date picker

4. **"Vui lòng chọn giờ đến"**
   - Chưa chọn giờ
   - Giải pháp: Chọn giờ từ time picker

5. **"Không thể đặt bàn vào thời gian trong quá khứ"**
   - Đã chọn ngày/giờ trong quá khứ
   - Giải pháp: Chọn ngày giờ trong tương lai

6. **Không thấy nút "Đặt bàn"**
   - Bàn không ở trạng thái "Trống"
   - Giải pháp: Chọn bàn trống hoặc thay đổi trạng thái bàn về "Trống"

## Demo Flow

### Ví dụ thực tế:

**Scenario: Khách gọi đặt bàn**

1. Khách: "Tôi muốn đặt bàn 4 người lúc 19h tối nay"
2. Nhân viên vào page Tables → Chọn bàn trống phù hợp
3. Click "Đặt bàn"
4. Nhập:
   - Tên: Nguyễn Văn A
   - SĐT: 0123456789
   - Ngày đến: 10/10/2025
   - Giờ đến: 19:00
   - Số khách: 4
   - Ghi chú: "Đặt bàn gần cửa sổ, sinh nhật"
5. Click "Đặt bàn" → Bàn chuyển màu cam
6. Card bàn hiển thị: "Nguyễn Văn A • 4 khách • 10/10 19:00"
7. Lúc 19h khách đến → Click vào bàn → "Bắt đầu gọi món"
8. Nhận order và phục vụ khách

## Support

Nếu gặp vấn đề với tính năng đặt bàn, vui lòng kiểm tra:
1. Backend server đang chạy
2. Database connection OK
3. Console browser để xem lỗi
4. Network tab để check API calls

---
*Tài liệu cập nhật: Tháng 10, 2025*

