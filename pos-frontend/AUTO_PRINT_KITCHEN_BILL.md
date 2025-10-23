# 🍳 Auto Print Kitchen Bill - Tự động in phiếu bếp

## 🎯 Tính năng mới

### 1. **Tự động in phiếu bếp khi đặt món tại bàn**
- Khi khách đặt món tại bàn → Tự động in phiếu bếp ngay lập tức
- Không cần thao tác thủ công từ nhân viên
- Bếp nhận được thông tin món ăn ngay khi đơn hàng được tạo

### 2. **Bỏ thuế VAT khỏi bill**
- Giá món ăn đã bao gồm thuế
- Không tính thêm VAT trong hóa đơn
- Hiển thị "Giá đã bao gồm thuế VAT"

## 🔧 Cách hoạt động

### Luồng tự động in phiếu bếp:
```
Khách đặt món tại bàn
        ↓
Đơn hàng được tạo (status: Pending)
        ↓
Tự động in phiếu bếp cho bếp
        ↓
Bếp nhận được danh sách món ăn
        ↓
Bắt đầu chuẩn bị món
```

### Điều kiện tự động in:
- ✅ Đặt món **tại bàn** (có tableId)
- ✅ Không phải đơn guest
- ✅ Đơn hàng được tạo thành công
- ❌ Không in cho đơn guest/takeaway

## 📋 Nội dung phiếu bếp tự động

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
├─────────────────────────────────────┤
│ ⏰ In lúc: 01/10/2025 14:35        │
│ 🏪 Hệ thống POS Restaurant         │
└─────────────────────────────────────┘
```

**Đặc điểm phiếu bếp:**
- ✅ Chỉ có tên món và số lượng
- ✅ Không có giá tiền (để bếp tập trung vào nấu ăn)
- ✅ Thông tin bàn và khách hàng
- ✅ Thời gian đặt và in
- ✅ Mã đơn hàng để theo dõi

## 💰 Hóa đơn thanh toán (khi completed)

```
┌─────────────────────────────────────┐
│        🧾 HÓA ĐƠN THANH TOÁN       │
│      RESTAURANT POS SYSTEM         │
├─────────────────────────────────────┤
│ Phở Bò        2  150,000   300,000 │
│ Cà phê đen    1   75,000    75,000 │
├─────────────────────────────────────┤
│ TỔNG CỘNG (đã bao gồm thuế):       │
│                         375,000 Ft │
│                                    │
│      * Giá đã bao gồm thuế VAT     │
└─────────────────────────────────────┘
```

**Thay đổi về thuế:**
- ❌ Không tính thuế VAT riêng
- ✅ Hiển thị "đã bao gồm thuế"
- ✅ Tổng cộng = giá món ăn (đã có thuế)

## 🔄 So sánh trước và sau

### Trước khi cập nhật:
```
Đặt món → Tạo đơn → Nhân viên thủ công in bill → Bếp nhận
                                ↑
                        Cần thao tác thủ công
```

### Sau khi cập nhật:
```
Đặt món → Tạo đơn → Tự động in phiếu bếp → Bếp nhận ngay
                            ↑
                    Hoàn toàn tự động
```

## 🎨 Giao diện người dùng

### Thông báo khi đặt món:
- **Trước**: "🖨️ Order sent to kitchen & printing receipt..."
- **Sau**: "🍳 Đơn hàng đã gửi bếp & in phiếu bếp tự động!"

### Nút Print trong các trang:
- **Pending orders**: `🍳 In phiếu bếp` (không có giá)
- **Completed orders**: `🧾 In hóa đơn` (có giá, đã bao gồm thuế)

## 🧪 Testing Guide

### Test tự động in phiếu bếp:
1. **Vào trang Tables** → Chọn bàn
2. **Thêm món** vào giỏ hàng
3. **Nhập thông tin khách** hàng
4. **Click "Place Order"**
5. **Kiểm tra**: Phiếu bếp tự động mở và in
6. **Xác nhận**: Chỉ có tên món, không có giá

### Test hóa đơn thanh toán:
1. **Cập nhật đơn** thành "Completed"
2. **Click "In hóa đơn"**
3. **Kiểm tra**: Có giá tiền, không có VAT riêng
4. **Xác nhận**: Hiển thị "đã bao gồm thuế"

### Test không in cho guest orders:
1. **Đặt món guest** (không chọn bàn)
2. **Place order**
3. **Xác nhận**: Không tự động in phiếu bếp

## 🔧 Technical Implementation

### File thay đổi:

#### 1. `billTemplates.js`:
```javascript
// Bỏ tính thuế VAT
const total = order.totalAmount || order.bills?.totalWithTax || order.bills?.total || 0;

// Hiển thị đã bao gồm thuế
<span>TỔNG CỘNG (đã bao gồm thuế):</span>
<div>* Giá đã bao gồm thuế VAT</div>
```

#### 2. `PlaceOrderButton.jsx`:
```javascript
// Function tự động in phiếu bếp
const autoPrintKitchenBill = (orderData) => {
  const order = {
    ...orderData,
    orderStatus: 'Pending' // Luôn in phiếu bếp cho đơn mới
  };
  printBill(order); // Tự động chọn kitchen template
};

// Gọi khi đặt món tại bàn
if (tableId && tableId !== "guest") {
  autoPrintKitchenBill(orderData);
}
```

## 🎯 Benefits

### Cho Bếp:
- ✅ Nhận thông tin món ngay lập tức
- ✅ Không cần chờ nhân viên in thủ công
- ✅ Tập trung vào nấu ăn, không bị phân tâm bởi giá
- ✅ Workflow nhanh hơn và hiệu quả hơn

### Cho Nhân viên:
- ✅ Giảm thao tác thủ công
- ✅ Không quên in phiếu bếp
- ✅ Tập trung vào phục vụ khách hàng
- ✅ Quy trình tự động hóa

### Cho Khách hàng:
- ✅ Món ăn được chuẩn bị nhanh hơn
- ✅ Hóa đơn rõ ràng, không có thuế phức tạp
- ✅ Giá cả minh bạch (đã bao gồm thuế)

### Cho Quản lý:
- ✅ Kiểm soát quy trình tốt hơn
- ✅ Giảm sai sót do thủ công
- ✅ Tăng hiệu suất hoạt động
- ✅ Tiết kiệm thời gian và chi phí

## 🚀 Deployment Ready

Hệ thống hiện tại đã:
- ✅ Tự động in phiếu bếp khi đặt món tại bàn
- ✅ Bỏ thuế VAT phức tạp (giá đã bao gồm thuế)
- ✅ Phân biệt rõ phiếu bếp và hóa đơn thanh toán
- ✅ Workflow tự động hóa hoàn toàn
- ✅ Giao diện thân thiện và rõ ràng
- ✅ Không có lỗi runtime hoặc linting
