# Báo cáo Sửa lỗi Hệ thống Nhập Nguyên liệu

## Tổng quan
Đã phát hiện và sửa các lỗi trong hệ thống quản lý nguyên liệu, cải thiện quy trình nhập liệu và trải nghiệm người dùng.

## Các lỗi đã sửa

### 1. ❌ Lỗi Enum Validation - Backend Model
**Vấn đề:**
- Model `ingredientModel.js` có enum strict cho `category` và `unit`
- Frontend cho phép nhập "Others" (tùy chỉnh) nhưng backend reject
- Gây lỗi khi người dùng chọn danh mục hoặc đơn vị tùy chỉnh

**Giải pháp:**
```javascript
// TRƯỚC
category: { 
    type: String, 
    required: true,
    enum: ['Meat', 'Vegetables', 'Spices', 'Grains', 'Seafood', 'Dairy & Eggs', 'Others']
}

// SAU
category: { 
    type: String, 
    required: true,
    trim: true
}
```

**File:** `pos-backend/models/ingredientModel.js`

---

### 2. ❌ Lỗi Controller - Không nhận parameter `reason`
**Vấn đề:**
- Frontend gửi field `reason` trong request nhưng backend không nhận
- Controller hardcode `reason: 'PURCHASE'` 
- Không validate số lượng > 0
- Không cập nhật `pricePerUnit` khi nhập kho

**Giải pháp:**
```javascript
// Thêm validation
if (!quantity || quantity <= 0) {
    return res.status(400).json({
        success: false,
        message: 'Số lượng phải lớn hơn 0'
    });
}

// Nhận reason từ request
const { ingredientId, quantity, unitPrice, supplier, notes, reason } = req.body;

// Sử dụng reason từ request
reason: reason || 'PURCHASE',

// Cập nhật pricePerUnit
if (unitPrice) ingredient.pricePerUnit = unitPrice;
```

**File:** `pos-backend/controllers/ingredientController.js` - function `addStock()`

---

### 3. ❌ Lỗi Flow - Không tạo Transaction cho tồn kho ban đầu
**Vấn đề:**
- Khi tạo nguyên liệu mới với `currentStock > 0`, không có transaction record
- Thiếu audit trail cho tồn kho ban đầu
- Không theo dõi được nguồn gốc của số lượng ban đầu

**Giải pháp:**
```javascript
// Tạo nguyên liệu với stock = 0 trước
ingredientData.currentStock = 0;
const ingredient = new Ingredient(ingredientData);
await ingredient.save();

// Nếu có tồn ban đầu > 0, tạo transaction
if (initialStock > 0) {
    const transaction = new StockTransaction({
        ingredient: ingredient._id,
        type: 'IN',
        quantity: initialStock,
        unitPrice: ingredient.pricePerUnit,
        totalAmount: initialStock * ingredient.pricePerUnit,
        reason: 'ADJUSTMENT',
        notes: 'Tồn kho ban đầu khi tạo nguyên liệu',
        performedBy: req.user.id,
        previousStock: 0,
        newStock: initialStock
    });
    await transaction.save();
    
    // Cập nhật lại currentStock
    ingredient.currentStock = initialStock;
    await ingredient.save();
}
```

**File:** `pos-backend/controllers/ingredientController.js` - function `createIngredient()`

---

### 4. ❌ Thiếu Validation Frontend
**Vấn đề:**
- Không validate số lượng > 0 trước khi submit
- Không validate giá >= 0
- Không có error message chi tiết từ backend
- Không có min/step attributes cho number inputs

**Giải pháp:**
```javascript
// Thêm validation trong handleAddStock
if (!stockData.quantity || stockData.quantity <= 0) {
    enqueueSnackbar('Số lượng phải lớn hơn 0', { variant: 'error' });
    return;
}

if (!stockData.unitPrice || stockData.unitPrice < 0) {
    enqueueSnackbar('Giá đơn vị không hợp lệ', { variant: 'error' });
    return;
}

// Thêm validation trong handleSubmit
if (submitData.pricePerUnit < 0) {
    enqueueSnackbar('Giá đơn vị không được âm', { variant: 'error' });
    return;
}
// ... tương tự cho currentStock và minStock

// Hiển thị error message từ backend
const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
enqueueSnackbar(errorMsg, { variant: 'error' });
```

**File:** `pos-frontend/src/pages/Inventory.jsx`

---

### 5. 🎨 Cải thiện UX/UI

#### 5.1. Thêm HTML attributes cho number inputs
```jsx
<input
  type="number"
  min="0"           // Không cho phép số âm
  step="0.01"       // Cho phép số thập phân
  placeholder="Nhập số lượng"
  // ...
/>
```

#### 5.2. Disable field currentStock khi edit
```jsx
<label className="block text-[#ababab] mb-2">
  {editingIngredient ? 'Tồn kho hiện tại' : 'Tồn kho ban đầu'}
</label>
<input
  type="number"
  disabled={editingIngredient}  // Không cho edit trực tiếp
  // ...
/>
{editingIngredient && (
  <p className="text-xs text-yellow-400 mt-1">
    Dùng "Cập nhật tồn kho" để thay đổi số lượng
  </p>
)}
```

#### 5.3. Thêm helpful hints
- "Có thể nhập 0 và cập nhật sau" cho tồn kho ban đầu
- "Dùng 'Cập nhật tồn kho' để thay đổi số lượng" khi edit
- Placeholder cho tất cả các inputs

#### 5.4. Xử lý parseFloat an toàn
```jsx
onChange={(e) => setStockData({
  ...stockData, 
  quantity: parseFloat(e.target.value) || 0  // Tránh NaN
})}
```

---

## Quy trình mới đã chuẩn hóa

### Tạo nguyên liệu mới
1. Nhập thông tin cơ bản (tên, danh mục, đơn vị, giá)
2. Có thể nhập tồn kho ban đầu hoặc để 0
3. Backend tự động tạo transaction nếu tồn kho > 0
4. Transaction có reason = 'ADJUSTMENT', notes = 'Tồn kho ban đầu'

### Cập nhật tồn kho
1. Click "Cập nhật tồn kho" trên ingredient card
2. Nhập số lượng (phải > 0)
3. Nhập giá (mặc định là pricePerUnit hiện tại)
4. Chọn lý do: PURCHASE/ADJUSTMENT/TRANSFER/WASTE
5. Thêm ghi chú nếu cần
6. Backend validate và tạo transaction

### Sửa thông tin nguyên liệu
1. Click Edit icon
2. Có thể sửa: tên, danh mục, đơn vị, giá, minStock, supplier
3. **KHÔNG thể** sửa trực tiếp currentStock (disabled)
4. Phải dùng "Cập nhật tồn kho" để thay đổi số lượng

---

## Files đã thay đổi

### Backend
1. ✅ `pos-backend/models/ingredientModel.js`
   - Bỏ enum strict cho category và unit
   - Cho phép custom values

2. ✅ `pos-backend/controllers/ingredientController.js`
   - Fix `addStock()`: nhận reason parameter, validate quantity, update pricePerUnit
   - Fix `createIngredient()`: tự động tạo transaction cho tồn kho ban đầu

### Frontend
3. ✅ `pos-frontend/src/pages/Inventory.jsx`
   - Thêm validation đầy đủ
   - Thêm min/step/placeholder cho inputs
   - Disable currentStock khi edit
   - Conditional labels và hints
   - Error handling tốt hơn

### Documentation
4. ✅ `pos-backend/INGREDIENT_MANAGEMENT_GUIDE.md`
   - Hướng dẫn đầy đủ về quy trình
   - Schema và validation rules
   - Best practices
   - Troubleshooting

5. ✅ `INGREDIENT_SYSTEM_FIXES.md` (file này)
   - Tóm tắt các lỗi đã sửa
   - Changelog chi tiết

---

## Testing Checklist

### Backend API
- [ ] POST /api/ingredients - tạo với tồn kho = 0
- [ ] POST /api/ingredients - tạo với tồn kho > 0 (kiểm tra transaction)
- [ ] POST /api/ingredients/stock/add - với reason khác nhau
- [ ] PUT /api/ingredients/:id - update thông tin
- [ ] GET /api/ingredients/history - xem lịch sử transaction

### Frontend UI
- [ ] Tạo nguyên liệu mới với category/unit tùy chỉnh
- [ ] Tạo nguyên liệu với tồn kho ban đầu = 0
- [ ] Tạo nguyên liệu với tồn kho ban đầu > 0
- [ ] Cập nhật tồn kho với reason khác nhau
- [ ] Edit thông tin nguyên liệu (currentStock phải disabled)
- [ ] Validate: nhập số âm (phải bị chặn)
- [ ] Validate: nhập số lượng = 0 khi update stock (phải có lỗi)

### Integration
- [ ] Transaction được tạo đúng khi tạo ingredient với stock > 0
- [ ] Transaction được tạo đúng khi update stock
- [ ] Error messages từ backend hiển thị đúng trên frontend
- [ ] Custom category/unit được lưu và hiển thị đúng

---

## Lưu ý quan trọng

### ⚠️ Breaking Changes
1. **Model schema changed** - Cần restart backend server
2. **Quy trình tạo transaction mới** - Tất cả tồn kho ban đầu giờ có transaction

### 🔧 Migration (nếu cần)
Nếu có dữ liệu cũ chưa có transaction cho tồn kho ban đầu:
```javascript
// Script migration (tùy chọn)
const ingredients = await Ingredient.find({ currentStock: { $gt: 0 } });
for (const ingredient of ingredients) {
    // Kiểm tra xem đã có transaction chưa
    const hasTransaction = await StockTransaction.findOne({ 
        ingredient: ingredient._id 
    });
    
    if (!hasTransaction && ingredient.currentStock > 0) {
        // Tạo transaction cho tồn kho hiện tại
        await StockTransaction.create({
            ingredient: ingredient._id,
            type: 'IN',
            quantity: ingredient.currentStock,
            unitPrice: ingredient.pricePerUnit,
            totalAmount: ingredient.currentStock * ingredient.pricePerUnit,
            reason: 'ADJUSTMENT',
            notes: 'Migration: Tồn kho ban đầu',
            performedBy: adminUserId,
            previousStock: 0,
            newStock: ingredient.currentStock
        });
    }
}
```

---

## Kết luận

✅ **Đã sửa xong tất cả các lỗi chính:**
1. Backend model không còn reject custom category/unit
2. Controller nhận và xử lý đúng tất cả parameters
3. Tạo transaction cho tồn kho ban đầu
4. Frontend có validation đầy đủ
5. UX/UI được cải thiện đáng kể

✅ **Quy trình nhập nguyên liệu đã chuẩn hóa:**
- Tạo mới: rõ ràng, có audit trail
- Cập nhật: an toàn, không thể bypass transaction
- Sửa thông tin: phân biệt rõ với cập nhật stock

✅ **Documentation đầy đủ:**
- Hướng dẫn sử dụng
- Best practices
- Troubleshooting

📝 **Next steps:**
1. Test thoroughly trên dev environment
2. Restart backend server để apply model changes
3. Test các edge cases
4. Deploy lên production khi đã test xong

