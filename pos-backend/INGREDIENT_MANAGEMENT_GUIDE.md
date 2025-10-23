# Hướng dẫn Quản lý Nguyên liệu

## Quy trình nhập nguyên liệu mới

### 1. Tạo nguyên liệu mới

Khi tạo nguyên liệu mới, hệ thống hoạt động như sau:

```javascript
// Bước 1: Tạo nguyên liệu với tồn kho ban đầu
POST /api/ingredients
{
  name: "Thịt gà",
  category: "Meat",
  unit: "kg",
  currentStock: 10,      // Tồn kho ban đầu
  minStock: 5,           // Mức cảnh báo
  pricePerUnit: 50000,   // Giá đơn vị
  supplier: "Nhà cung cấp A",
  description: "Mô tả nguyên liệu"
}
```

**Lưu ý:**
- Hệ thống sẽ tự động tạo một transaction record cho tồn kho ban đầu nếu `currentStock > 0`
- Transaction này có type = 'IN' và reason = 'ADJUSTMENT'
- Nếu `currentStock = 0`, không tạo transaction

### 2. Cập nhật tồn kho (Nhập/Xuất kho)

#### Nhập kho
```javascript
POST /api/ingredients/stock/add
{
  ingredientId: "ingredient_id",
  quantity: 10,          // Số lượng nhập
  unitPrice: 50000,      // Giá nhập
  reason: "PURCHASE",    // PURCHASE, ADJUSTMENT, TRANSFER
  notes: "Nhập kho từ nhà cung cấp",
  supplier: "Nhà cung cấp A" (optional)
}
```

Các lý do nhập kho:
- **PURCHASE**: Mua hàng từ nhà cung cấp
- **ADJUSTMENT**: Điều chỉnh tồn kho
- **TRANSFER**: Chuyển kho

#### Xuất kho
```javascript
POST /api/ingredients/stock/reduce
{
  ingredientId: "ingredient_id",
  quantity: 5,           // Số lượng xuất
  reason: "SALE",        // SALE, WASTE, ADJUSTMENT, TRANSFER
  notes: "Xuất kho cho đơn hàng #123"
}
```

Các lý do xuất kho:
- **SALE**: Bán hàng (tự động khi có đơn)
- **WASTE**: Hao hụt, hư hỏng
- **ADJUSTMENT**: Điều chỉnh tồn kho
- **TRANSFER**: Chuyển kho

### 3. Cập nhật thông tin nguyên liệu

```javascript
PUT /api/ingredients/:id
{
  name: "Tên mới",
  category: "Danh mục mới",
  unit: "Đơn vị mới",
  minStock: 5,           // Có thể thay đổi
  pricePerUnit: 55000,   // Có thể thay đổi
  supplier: "Nhà cung cấp B",
  description: "Mô tả mới"
  // currentStock KHÔNG được thay đổi qua route này
}
```

**Quan trọng:**
- Không thể thay đổi `currentStock` trực tiếp khi edit
- Phải dùng API `/stock/add` hoặc `/stock/reduce` để thay đổi tồn kho
- Điều này đảm bảo mọi thay đổi tồn kho đều được ghi lại (audit trail)

### 4. Xem lịch sử nhập xuất

```javascript
GET /api/ingredients/history?ingredientId=xxx&type=IN&startDate=2024-01-01
```

Parameters:
- `ingredientId`: Lọc theo nguyên liệu
- `type`: IN hoặc OUT
- `startDate`, `endDate`: Lọc theo thời gian

### 5. Kiểm tra nguyên liệu sắp hết

```javascript
GET /api/ingredients/low-stock
```

Trả về danh sách nguyên liệu có `currentStock <= minStock`

## Model Schema

### Ingredient Model
```javascript
{
  name: String,          // Unique
  category: String,      // Không giới hạn enum
  unit: String,          // Không giới hạn enum
  currentStock: Number,  // >= 0
  minStock: Number,      // >= 0
  pricePerUnit: Number,  // >= 0
  supplier: String,
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Stock Transaction Model
```javascript
{
  ingredient: ObjectId,
  type: 'IN' | 'OUT',
  quantity: Number,
  unitPrice: Number,
  totalAmount: Number,
  reason: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER',
  reference: String,     // Mã đơn hàng, hóa đơn
  notes: String,
  performedBy: ObjectId, // User ID
  previousStock: Number,
  newStock: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Best Practices

### 1. Quy trình tạo nguyên liệu mới
1. **Nhập thông tin cơ bản**: Tên, danh mục, đơn vị, giá
2. **Đặt tồn kho ban đầu = 0** hoặc số lượng hiện có
3. **Đặt mức cảnh báo** (minStock) phù hợp
4. **Lưu lại** - hệ thống tự tạo transaction nếu có tồn đầu

### 2. Quy trình nhập kho
1. Chọn "Cập nhật tồn kho" trên ingredient card
2. Nhập số lượng > 0
3. Nhập giá nhập (mặc định là pricePerUnit hiện tại)
4. Chọn lý do: thường là "PURCHASE"
5. Thêm ghi chú nếu cần
6. Lưu lại

### 3. Quy trình sửa thông tin
- **Sửa thông tin cơ bản**: Click Edit icon
- **Thay đổi tồn kho**: KHÔNG edit trực tiếp, dùng "Cập nhật tồn kho"
- **Lý do**: Đảm bảo audit trail đầy đủ

### 4. Custom Category và Unit
- Frontend cho phép chọn "Others" để nhập custom
- Backend không giới hạn enum nữa (đã fix)
- Có thể nhập bất kỳ category/unit nào

## Validation Rules

### Frontend
- Tất cả số lượng phải >= 0
- Số lượng nhập kho phải > 0
- Custom category/unit không được rỗng khi chọn "Others"
- Các số nhập vào phải hợp lệ (không phải NaN)

### Backend
- `name` phải unique
- `currentStock`, `minStock`, `pricePerUnit` >= 0
- Khi nhập kho: quantity > 0
- Khi xuất kho: quantity <= currentStock
- Transaction phải có `performedBy` (user ID)

## UI/UX Improvements

### Đã implement:
1. ✅ Validation đầy đủ cho tất cả inputs
2. ✅ Placeholder và hints cho các trường nhập
3. ✅ Disable trường currentStock khi edit (với hint)
4. ✅ Min/step attributes cho number inputs
5. ✅ Error messages chi tiết
6. ✅ Custom category/unit support
7. ✅ Stock transaction auto-creation

### Labels rõ ràng:
- "Tồn kho ban đầu" khi tạo mới
- "Tồn kho hiện tại" khi edit (disabled)
- Hint: "Có thể nhập 0 và cập nhật sau"
- Hint: "Dùng 'Cập nhật tồn kho' để thay đổi số lượng"

## Troubleshooting

### Lỗi: "Tên nguyên liệu đã tồn tại"
- Tên nguyên liệu phải unique
- Kiểm tra xem đã có nguyên liệu trùng tên chưa

### Lỗi: "Số lượng trong kho không đủ"
- Xảy ra khi xuất kho nhiều hơn tồn kho hiện tại
- Kiểm tra lại số lượng tồn kho

### Lỗi validation khi tạo custom category/unit
- Đảm bảo backend đã update (không còn enum strict)
- Restart backend server sau khi update model

### Transaction không được tạo cho tồn kho ban đầu
- Kiểm tra `performedBy` có hợp lệ không
- Xem logs backend để debug

