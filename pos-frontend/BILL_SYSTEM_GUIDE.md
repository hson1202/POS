# 🧾 Bill System Guide - Hệ thống In Bill Thông minh

## 🎯 Tổng quan

Hệ thống bill mới có **2 loại bill khác nhau** tùy theo trạng thái đơn hàng:

### 1. **🍳 Phiếu Bếp** (Kitchen Bill)
- **Khi nào**: Đơn hàng chưa completed (Pending, In Progress, Ready)
- **Mục đích**: Cho bếp đọc và chuẩn bị món ăn
- **Nội dung**: Chỉ danh sách món ăn + số lượng, không có giá tiền

### 2. **🧾 Hóa Đơn Thanh Toán** (Full Bill)
- **Khi nào**: Đơn hàng đã completed hoặc từ Order History
- **Mục đích**: Thanh toán cho khách hàng
- **Nội dung**: Đầy đủ giá tiền, thuế, tổng cộng

## 🔧 Cách hoạt động

### Logic tự động:
```javascript
// Hệ thống tự động chọn loại bill
const orderStatus = order.orderStatus || order.status;
const isCompleted = orderStatus.toLowerCase() === 'completed';

if (isCompleted) {
  // In hóa đơn thanh toán đầy đủ
  generateFullBill(order);
} else {
  // In phiếu bếp (chỉ món ăn)
  generateKitchenBill(order);
}
```

## 📋 Nội dung từng loại bill

### 🍳 **Phiếu Bếp** (Kitchen Bill)

```
┌─────────────────────────────────────┐
│           🍳 PHIẾU BẾP              │
│        Order ID: #ABC123           │
├─────────────────────────────────────┤
│ 🏠 Bàn: 5                          │
│ 👤 Khách: Nguyễn Văn A             │
│ ⏰ Thời gian: 01/10/2025 14:30     │
├─────────────────────────────────────┤
│      📋 DANH SÁCH MÓN ĂN           │
├─────────────────────────────────────┤
│ 🍽️ Phở Bò                         │
│ 📊 Số lượng: 2                     │
├─────────────────────────────────────┤
│ 🍽️ Cà phê đen                     │
│ 📊 Số lượng: 1                     │
│ 📝 Ghi chú: Ít đường              │
├─────────────────────────────────────┤
│ ⏰ In lúc: 01/10/2025 14:35        │
│ 🏪 Hệ thống POS Restaurant         │
└─────────────────────────────────────┘
```

**Đặc điểm:**
- ✅ Không có giá tiền
- ✅ Tập trung vào món ăn và số lượng
- ✅ Ghi chú đặc biệt nếu có
- ✅ Thông tin bàn và khách hàng
- ✅ Thời gian để theo dõi

### 🧾 **Hóa Đơn Thanh Toán** (Full Bill)

```
┌─────────────────────────────────────┐
│        🧾 HÓA ĐƠN THANH TOÁN       │
│      RESTAURANT POS SYSTEM         │
│   Địa chỉ: 123 Đường ABC, Quận XYZ │
├─────────────────────────────────────┤
│ 🏠 Bàn: 5        📄 Mã: #ABC123    │
│ 👤 Khách: Nguyễn Văn A             │
│ 📞 SĐT: 0123456789                 │
│ ⏰ Thời gian: 01/10/2025 14:30     │
├─────────────────────────────────────┤
│ Tên món      SL  Đơn giá  Thành tiền│
├─────────────────────────────────────┤
│ Phở Bò        2  150,000   300,000 │
│ Cà phê đen    1   75,000    75,000 │
├─────────────────────────────────────┤
│ Tạm tính:               375,000 Ft │
│ Thuế VAT (10%):          37,500 Ft │
│ ─────────────────────────────────── │
│ TỔNG CỘNG:              412,500 Ft │
├─────────────────────────────────────┤
│   🎉 CẢM ƠN QUÝ KHÁCH! HẸN GẶP LẠI! │
└─────────────────────────────────────┘
```

**Đặc điểm:**
- ✅ Đầy đủ giá tiền từng món
- ✅ Tính thuế VAT
- ✅ Tổng cộng rõ ràng
- ✅ Thông tin công ty
- ✅ Định dạng chuyên nghiệp

## 🖨️ Nút Print trong các trang

### 1. **Orders Page** (OrderCard)
```javascript
// Nút print thay đổi theo trạng thái
{order.orderStatus?.toLowerCase() === 'completed' ? 'In hóa đơn' : 'In phiếu bếp'}
```

### 2. **Kitchen Display**
```javascript
// Luôn có nút print, thay đổi theo trạng thái
<button title={getBillTypeDescription(order)}>
  {order.orderStatus?.toLowerCase() === 'completed' ? 'In hóa đơn' : 'In phiếu bếp'}
</button>
```

### 3. **Order History**
```javascript
// Luôn in hóa đơn đầy đủ
printBill(order, true); // Force full bill
```

## 🎨 Giao diện người dùng

### Nút Print thông minh:
- **Pending/In Progress**: `🍳 In phiếu bếp` (màu tím)
- **Completed**: `🧾 In hóa đơn` (màu xanh)
- **Order History**: `🖨️ In hóa đơn` (luôn full bill)

### Tooltip hiển thị:
- Hover vào nút sẽ hiện mô tả loại bill sẽ được in
- Giúp user hiểu rõ sẽ in gì

## 🔄 Luồng sử dụng

### Từ Kitchen Display:
1. **Đơn mới (Pending)** → Click `In phiếu bếp` → In danh sách món cho bếp
2. **Đang làm (In Progress)** → Click `In phiếu bếp` → In lại nếu cần
3. **Hoàn thành (Completed)** → Click `In hóa đơn` → In bill thanh toán

### Từ Orders Page:
1. Click vào đơn hàng → Xem chi tiết
2. Click nút Print → Tự động chọn loại bill phù hợp
3. Completed orders → Full bill, Others → Kitchen bill

### Từ Order History:
1. Tất cả đơn hàng → Luôn in full bill
2. Phù hợp cho việc in lại hóa đơn cho khách

## 🧪 Testing Guide

### Test Kitchen Bill:
1. Tạo đơn hàng mới (status: Pending)
2. Vào Kitchen Display → Click `In phiếu bếp`
3. Kiểm tra: Chỉ có món ăn, không có giá tiền

### Test Full Bill:
1. Cập nhật đơn hàng thành Completed
2. Click `In hóa đơn`
3. Kiểm tra: Đầy đủ giá tiền, thuế, tổng cộng

### Test Auto Switch:
1. Đơn Pending → Nút hiện `In phiếu bếp`
2. Cập nhật thành Completed → Nút đổi thành `In hóa đơn`
3. Kiểm tra nội dung bill khác nhau

## 📱 Responsive Design

### Desktop:
- Nút print rõ ràng với icon và text
- Tooltip hiển thị đầy đủ thông tin

### Mobile:
- Nút print compact nhưng vẫn rõ ràng
- Icon FaPrint dễ nhận biết

## 🔧 Technical Implementation

### File Structure:
```
pos-frontend/src/utils/billTemplates.js
├── generateKitchenBill()     // Tạo phiếu bếp
├── generateFullBill()        // Tạo hóa đơn đầy đủ
├── printBill()              // Logic in thông minh
└── getBillTypeDescription() // Mô tả loại bill
```

### Integration:
- **OrderCard.jsx**: Nút print trong modal chi tiết
- **KitchenDisplay.jsx**: Nút print cho từng order card
- **OrderHistory.jsx**: Nút print luôn full bill

## 🎯 Benefits

### Cho Bếp:
- ✅ Phiếu bếp sạch sẽ, tập trung vào món ăn
- ✅ Không bị phân tâm bởi giá tiền
- ✅ Dễ đọc và theo dõi

### Cho Cashier:
- ✅ Hóa đơn chuyên nghiệp cho khách
- ✅ Đầy đủ thông tin thanh toán
- ✅ Tự động chọn đúng loại bill

### Cho Quản lý:
- ✅ Kiểm soát thông tin hiển thị
- ✅ Workflow rõ ràng theo trạng thái
- ✅ Tiết kiệm giấy và mực in

## 🚀 Future Enhancements

### Có thể thêm:
- 📧 Email bill cho khách hàng
- 📱 SMS bill summary
- 💾 Lưu bill history
- 🎨 Custom bill templates
- 🌐 Multi-language bills
- 📊 Bill analytics
