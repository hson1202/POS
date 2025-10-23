# Tính Năng Xóa Bàn (Delete Table)

## Tổng Quan

Tính năng cho phép admin xóa các bàn không còn sử dụng trong hệ thống. Tính năng này có các biện pháp bảo vệ để tránh xóa nhầm bàn đang có khách.

---

## Quy Tắc Xóa Bàn

### ✅ Có Thể Xóa
- Bàn có trạng thái **"Available"** (Trống)
- Bàn không có order đang hoạt động
- Bàn không có khách đang ngồi

### ❌ Không Thể Xóa
- Bàn có trạng thái **"Occupied"** (Đang dùng)
- Bàn có trạng thái **"Booked"** (Đã đặt)
- Bàn có `currentOrder` (có order đang hoạt động)

**Lý do**: Tránh mất dữ liệu order và gây nhầm lẫn cho khách hàng.

---

## Cách Sử Dụng

### Bước 1: Vào Trang Tables
1. Đăng nhập với tài khoản Admin
2. Vào trang **Tables** (Bàn)

### Bước 2: Mở Chi Tiết Bàn
1. Nhấn vào bàn cần xóa (bàn trống - màu trắng)
2. Modal chi tiết bàn sẽ hiện ra

### Bước 3: Nhấn Nút "Xóa Bàn"
1. Ở góc dưới bên trái của modal, nhấn nút đỏ **"Xóa bàn"** (có icon thùng rác)
2. Modal xác nhận sẽ hiện ra

### Bước 4: Xác Nhận Xóa
1. Kiểm tra thông tin bàn trong modal xác nhận:
   - Số bàn
   - Số ghế
   - Trạng thái
2. Nhấn nút đỏ **"Xóa bàn"** để xác nhận
3. Hoặc nhấn **"Hủy"** để hủy bỏ

### Kết Quả
- ✅ Bàn bị xóa khỏi hệ thống
- ✅ Thông báo "Xóa bàn thành công!" hiện ra
- ✅ Danh sách bàn tự động cập nhật
- ✅ Modal tự động đóng

---

## Giao Diện

### Nút "Xóa Bàn" trong Modal Chi Tiết
```
┌─────────────────────────────────────┐
│ Chi tiết bàn 5                  [X] │
├─────────────────────────────────────┤
│                                     │
│ [Thông tin bàn]                     │
│ [Thông tin khách hàng]              │
│ [Đơn hiện tại]                      │
│                                     │
├─────────────────────────────────────┤
│ [🗑️ Xóa bàn]        [✓ Đóng]      │
└─────────────────────────────────────┘
```

### Modal Xác Nhận Xóa
```
┌──────────────────────────────────────┐
│  🗑️  Xác nhận xóa bàn                │
│      Hành động này không thể hoàn tác │
├──────────────────────────────────────┤
│                                      │
│  Bạn có chắc muốn xóa bàn này?       │
│  Bàn 5 • 4 ghế • Trống              │
│                                      │
├──────────────────────────────────────┤
│              [Hủy] [🗑️ Xóa bàn]     │
└──────────────────────────────────────┘
```

---

## Backend Implementation

### API Endpoint
```
DELETE /api/table/:id
```

### Request
```javascript
Headers: {
  Authorization: Bearer <token>
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Table deleted successfully!"
}
```

### Response Error (400)
```json
{
  "success": false,
  "message": "Cannot delete table with active orders! Please complete or cancel the order first."
}
```

### Response Error (404)
```json
{
  "success": false,
  "message": "Table not found!"
}
```

### Logic Backend (tableController.js)
```javascript
const deleteTable = async (req, res, next) => {
  // 1. Validate table ID
  // 2. Find table
  // 3. Check if table is occupied or has active orders
  // 4. If yes → Return error
  // 5. If no → Delete table
  // 6. Return success
};
```

---

## Frontend Implementation

### Component: TableCard.jsx

#### State Management
```javascript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

#### Mutation
```javascript
const deleteTableMutation = useMutation({
  mutationFn: (tableId) => deleteTableAPI(tableId),
  onSuccess: () => {
    // Show success notification
    // Invalidate tables query
    // Close modals
  },
  onError: (error) => {
    // Show error notification
  },
});
```

#### Delete Button Visibility
- Chỉ hiện khi `status === "Available"`
- Ẩn khi bàn đang dùng hoặc đã đặt

---

## Các Trường Hợp Đặc Biệt

### Trường Hợp 1: Xóa Bàn Đang Có Khách
**Hành động**: Nhấn "Xóa bàn" cho bàn Occupied
**Kết quả**: Nút xóa bị disable, hiện cảnh báo:
```
⚠️ Không thể xóa bàn đang có khách hoặc đã đặt. 
   Vui lòng hoàn tất order trước.
```

### Trường Hợp 2: Xóa Bàn Đã Đặt
**Hành động**: Nhấn "Xóa bàn" cho bàn Booked
**Kết quả**: Tương tự trường hợp 1 - không cho phép xóa

### Trường Hợp 3: Xóa Bàn Trống
**Hành động**: Nhấn "Xóa bàn" cho bàn Available
**Kết quả**: 
1. Modal xác nhận hiện ra
2. Nhấn "Xóa bàn" → Bàn bị xóa
3. Danh sách cập nhật

### Trường Hợp 4: Backend Lỗi
**Hành động**: Xóa bàn nhưng backend trả lỗi
**Kết quả**: 
- Hiện thông báo lỗi: "Xóa bàn thất bại!"
- Hoặc thông báo cụ thể từ backend
- Modal không đóng, cho phép thử lại

---

## Security

### Authentication
- Endpoint yêu cầu `isVerifiedUser` middleware
- Chỉ user đã đăng nhập mới có thể xóa bàn

### Authorization
- Trong thực tế, nên kiểm tra role = "admin"
- Hiện tại: Tất cả user đã đăng nhập đều có thể xóa

**Khuyến nghị**: Thêm middleware `adminAuth` vào route:
```javascript
router.route("/:id").delete(isVerifiedUser, adminAuth, deleteTable);
```

### Validation
- Validate table ID (ObjectId format)
- Kiểm tra table tồn tại
- Kiểm tra status và currentOrder
- Prevent xóa bàn có order đang hoạt động

---

## Files Changed

### Backend
1. `pos-backend/controllers/tableController.js`
   - Added `deleteTable()` function
   - Validation logic
   - Error handling

2. `pos-backend/routes/tableRoute.js`
   - Added DELETE route
   - Import deleteTable controller

### Frontend
1. `pos-frontend/src/https/index.js`
   - Added `deleteTable()` API function

2. `pos-frontend/src/components/tables/TableCard.jsx`
   - Added delete button UI
   - Added confirmation modal
   - Added delete mutation
   - Added state management

---

## Testing Checklist

### Test Case 1: Xóa Bàn Trống
- [ ] Tạo bàn mới (status: Available)
- [ ] Mở chi tiết bàn
- [ ] Nhấn "Xóa bàn"
- [ ] Xác nhận xóa
- [ ] Kiểm tra bàn bị xóa khỏi danh sách
- [ ] Kiểm tra thông báo thành công

### Test Case 2: Không Thể Xóa Bàn Occupied
- [ ] Chọn bàn đang có khách (Occupied)
- [ ] Mở chi tiết bàn
- [ ] Kiểm tra nút "Xóa bàn" không hiện
- [ ] Hoặc nếu hiện thì bị disable

### Test Case 3: Không Thể Xóa Bàn Booked
- [ ] Chọn bàn đã đặt (Booked)
- [ ] Mở chi tiết bàn
- [ ] Kiểm tra nút "Xóa bàn" không hiện
- [ ] Backend reject request nếu cố gắng xóa

### Test Case 4: Hủy Xóa
- [ ] Mở modal xác nhận xóa
- [ ] Nhấn "Hủy"
- [ ] Kiểm tra modal đóng
- [ ] Kiểm tra bàn không bị xóa

### Test Case 5: Backend Error Handling
- [ ] Tắt backend server
- [ ] Thử xóa bàn
- [ ] Kiểm tra hiện thông báo lỗi
- [ ] Kiểm tra modal không đóng

### Test Case 6: Real-time Updates
- [ ] Mở 2 tabs cùng trang Tables
- [ ] Ở Tab 1, xóa 1 bàn
- [ ] Kiểm tra Tab 2 tự động cập nhật (có thể cần thêm socket event)

---

## Known Limitations

1. **No Socket Event**: Khi xóa bàn, các client khác cần refresh để thấy thay đổi
   - **Solution**: Thêm `notifyTableDelete()` trong socket.js

2. **No Undo**: Xóa bàn là hành động không thể hoàn tác
   - **Solution**: Thêm soft delete (thêm field `isDeleted: Boolean`)

3. **No Archive**: Bàn bị xóa vĩnh viễn khỏi database
   - **Solution**: Archive bàn thay vì xóa

---

## Future Enhancements

### 1. Soft Delete
```javascript
// Thay vì xóa hẳn, chỉ đánh dấu isDeleted
table.isDeleted = true;
table.deletedAt = new Date();
await table.save();
```

### 2. Archive Tables
```javascript
// Di chuyển bàn sang collection riêng
const ArchivedTable = require("../models/archivedTableModel");
await ArchivedTable.create(table);
await Table.findByIdAndDelete(id);
```

### 3. Admin-Only Delete
```javascript
router.route("/:id").delete(isVerifiedUser, adminAuth, deleteTable);
```

### 4. Bulk Delete
```javascript
// Xóa nhiều bàn cùng lúc
router.route("/bulk-delete").post(isVerifiedUser, adminAuth, bulkDeleteTables);
```

### 5. Restore Deleted Tables
```javascript
// Khôi phục bàn đã xóa trong vòng 30 ngày
router.route("/:id/restore").post(isVerifiedUser, adminAuth, restoreTable);
```

---

## Support

Nếu gặp vấn đề:
1. Check console logs (frontend & backend)
2. Check network tab trong DevTools
3. Verify table status trong database
4. Check user permissions
5. Báo lỗi với screenshot và logs

---

## Summary

✅ Tính năng xóa bàn đã được implement đầy đủ
✅ Có validation để tránh xóa nhầm
✅ Có confirmation modal để user xác nhận
✅ Error handling tốt
✅ UX thân thiện
✅ Chỉ cho phép xóa bàn trống (Available)

**Sử dụng thận trọng! Xóa bàn là hành động không thể hoàn tác.** 🗑️

