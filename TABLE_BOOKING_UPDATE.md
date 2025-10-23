# Cập nhật Tính năng Đặt bàn - Thêm Ngày Giờ

## Thay đổi chính

### 🎯 Vấn đề đã sửa
- Trước: Chỉ lưu thời gian tạo booking, không có ngày giờ khách dự kiến đến
- Sau: Có đầy đủ ngày giờ dự kiến khách đến + thời gian tạo booking

### 📝 Backend Changes

#### 1. Order Model (`pos-backend/models/orderModel.js`)
```javascript
// Thêm field mới
reservationDateTime: Date, // Ngày giờ dự kiến khách đến
```

#### 2. Table Controller (`pos-backend/controllers/tableController.js`)
- Lưu `reservationDateTime` khi tạo booking
- Populate thêm field `reservationDateTime` khi get tables

### 🎨 Frontend Changes

#### 1. TableCard Component (`pos-frontend/src/components/tables/TableCard.jsx`)

**State mới:**
```javascript
const [bookingData, setBookingData] = useState({
  customerName: "",
  customerPhone: "",
  guests: 1,
  notes: "",
  reservationDate: "",  // Mới
  reservationTime: ""   // Mới
});
```

**UI mới trong Booking Modal:**
- Input chọn ngày (type="date") - không cho chọn ngày quá khứ
- Input chọn giờ (type="time")
- Layout 2 cột cho ngày và giờ

**Validation mới:**
1. Kiểm tra đã chọn ngày
2. Kiểm tra đã chọn giờ
3. Kiểm tra không được đặt vào quá khứ

**Hiển thị mới:**
- Card bàn: Hiển thị ngày giờ dự kiến (DD/MM HH:mm)
- Modal chi tiết: 
  - "Ngày giờ đến" - reservationDateTime
  - "Thời gian đặt bàn" - bookingTime

## 🎬 Luồng sử dụng

### Đặt bàn:
1. Click "Đặt bàn" trên bàn trống
2. Nhập:
   - Tên khách ✓
   - SĐT ✓
   - **Ngày đến** ✓ (Mới)
   - **Giờ đến** ✓ (Mới)
   - Số khách
   - Ghi chú
3. Hệ thống validate:
   - Không được để trống ngày/giờ
   - Không được chọn thời gian quá khứ
4. Lưu booking với đầy đủ thông tin

### Xem thông tin:
- **Trên card:** "Nguyễn Văn A • 0123456789 • 4 khách • 10/10 19:00"
- **Trong modal:**
  - Ngày giờ đến: 10/10/2025 19:00
  - Thời gian đặt bàn: 10/10/2025 14:30

## 🔍 Validation Rules

1. **Tên khách** - Bắt buộc, không được rỗng
2. **SĐT** - Bắt buộc, không được rỗng
3. **Ngày đến** - Bắt buộc, >= ngày hiện tại
4. **Giờ đến** - Bắt buộc
5. **Kết hợp ngày + giờ** - Phải > thời gian hiện tại

## 📊 Data Structure

### Trước:
```json
{
  "bookingTime": "2025-10-10T14:30:00Z"
}
```

### Sau:
```json
{
  "bookingTime": "2025-10-10T14:30:00Z",      // Khi nào đặt
  "reservationDateTime": "2025-10-10T19:00:00Z" // Khách đến khi nào
}
```

## ✅ Testing Checklist

- [ ] Đặt bàn với ngày giờ hợp lệ → Thành công
- [ ] Đặt bàn không chọn ngày → Hiện lỗi "Vui lòng chọn ngày đến"
- [ ] Đặt bàn không chọn giờ → Hiện lỗi "Vui lòng chọn giờ đến"
- [ ] Đặt bàn vào quá khứ → Hiện lỗi "Không thể đặt bàn vào thời gian trong quá khứ"
- [ ] Hiển thị ngày giờ đúng format trên card
- [ ] Hiển thị đầy đủ thông tin trong modal chi tiết
- [ ] Form reset sau khi đặt bàn thành công
- [ ] Date picker không cho chọn ngày quá khứ

## 📚 Files Changed

### Backend:
- `pos-backend/models/orderModel.js`
- `pos-backend/controllers/tableController.js`

### Frontend:
- `pos-frontend/src/components/tables/TableCard.jsx`

### Documentation:
- `TABLE_BOOKING_GUIDE.md` (updated)
- `TABLE_BOOKING_UPDATE.md` (new)

---
*Update: October 10, 2025*



