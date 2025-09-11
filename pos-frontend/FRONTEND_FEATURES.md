# Hướng dẫn sử dụng tính năng Frontend mới

## Tổng quan

Đã thêm các tính năng mới vào hệ thống POS để quản lý kho và menu một cách toàn diện:

### 1. Trang "More" - Trung tâm tính năng
- **Đường dẫn**: `/more`
- **Mô tả**: Trang chính chứa tất cả các tính năng quản lý hệ thống
- **Tính năng**:
  - Quản lý kho
  - Quản lý menu
  - Báo cáo (sắp tới)
  - Quản lý nhân viên (sắp tới)
  - Cài đặt (sắp tới)
  - Hướng dẫn (sắp tới)

### 2. Quản lý kho (Inventory Management)
- **Đường dẫn**: `/inventory`
- **Mô tả**: Quản lý nguyên liệu và tồn kho

#### Tính năng chính:
- **Xem danh sách nguyên liệu**: Hiển thị tất cả nguyên liệu với thông tin chi tiết
- **Thêm nguyên liệu mới**: 
  - Tên nguyên liệu
  - Danh mục (Thịt, Rau củ, Gia vị, Ngũ cốc, Hải sản, Trứng sữa, Khác)
  - Đơn vị (g, kg, ml, l, cái, bó, gói, hộp)
  - Giá/đơn vị
  - Tồn kho hiện tại
  - Tồn tối thiểu
  - Nhà cung cấp
  - Mô tả

- **Cập nhật tồn kho**:
  - Thêm/bớt số lượng
  - Ghi chú lý do (Mua hàng, Điều chỉnh, Hỏng/Thất thoát, Chuyển kho)
  - Tự động tính toán tổng tiền

- **Cảnh báo tồn kho thấp**: Hiển thị cảnh báo khi nguyên liệu sắp hết
- **Sửa/xóa nguyên liệu**: Chỉnh sửa thông tin hoặc xóa nguyên liệu

### 3. Quản lý menu (Menu Management)
- **Đường dẫn**: `/menu-management`
- **Mô tả**: Quản lý món ăn và công thức

#### Tính năng chính:
- **Xem danh sách món ăn**: Hiển thị theo danh mục
- **Lọc theo danh mục**: Mì, Phở, Cơm, Bún, Cháo, Bánh mì, Gỏi, Canh, Món khai vị, Món tráng miệng, Đồ uống, Món ăn nhanh

- **Thêm món ăn mới**:
  - Thông tin cơ bản: Tên, danh mục, mô tả
  - Giá và thuế: Giá gốc, % thuế, tự động tính giá sau thuế
  - Thời gian chế biến
  - Trạng thái: Có sẵn/Hết hàng
  - Đặc điểm: Món chay, món cay
  - Chất gây dị ứng: Gluten, Tôm, Cua, Cá, Đậu phộng, Hạt điều, Sữa, Trứng, Đậu nành, Lúa mì
  - Thông tin dinh dưỡng: Calories, Protein, Carbs, Fat

- **Quản lý công thức**:
  - Thêm nguyên liệu vào công thức
  - Chỉ định số lượng cần thiết
  - Xem danh sách nguyên liệu trong công thức
  - Xóa nguyên liệu khỏi công thức

- **Sửa/xóa món ăn**: Chỉnh sửa thông tin hoặc xóa món ăn

## Cách sử dụng

### Truy cập tính năng mới:
1. Đăng nhập vào hệ thống
2. Nhấn nút "More" ở thanh điều hướng dưới
3. Chọn tính năng muốn sử dụng

### Quản lý kho:
1. Vào trang "Quản lý kho"
2. Nhấn "Thêm nguyên liệu" để tạo mới
3. Nhấn nút sửa (biểu tượng bút) để chỉnh sửa
4. Nhấn "Cập nhật tồn kho" để thay đổi số lượng
5. Nhấn nút xóa (biểu tượng thùng rác) để xóa

### Quản lý menu:
1. Vào trang "Quản lý menu"
2. Chọn danh mục muốn xem (hoặc "Tất cả")
3. Nhấn "Thêm món ăn" để tạo mới
4. Trong form thêm món ăn:
   - Điền thông tin cơ bản
   - Thêm công thức bằng cách chọn nguyên liệu và số lượng
   - Chọn chất gây dị ứng nếu có
   - Nhập thông tin dinh dưỡng
5. Nhấn nút sửa để chỉnh sửa món ăn
6. Nhấn nút xóa để xóa món ăn

## Lưu ý quan trọng

### Về category món ăn:
- Đã cập nhật từ category chung (Món chính, Món khai vị...) sang category cụ thể (Mì, Phở, Cơm, Bún...)
- Category mới: Mì, Phở, Cơm, Bún, Cháo, Bánh mì, Gỏi, Canh, Món khai vị, Món tráng miệng, Đồ uống, Món ăn nhanh

### Về công thức:
- Mỗi món ăn có thể có nhiều nguyên liệu
- Số lượng nguyên liệu sẽ tự động trừ khi đặt hàng
- Hệ thống sẽ kiểm tra tồn kho trước khi cho phép đặt hàng

### Về thuế:
- Mỗi món ăn có thể có % thuế riêng
- Giá sau thuế được tính tự động
- Hiển thị cả giá gốc và giá sau thuế

## Tích hợp với hệ thống hiện tại

- **Tự động trừ kho**: Khi đặt hàng, nguyên liệu sẽ tự động trừ theo công thức
- **Kiểm tra tồn kho**: Hệ thống kiểm tra đủ nguyên liệu trước khi cho phép đặt hàng
- **Tính thuế**: Tự động tính và hiển thị giá sau thuế
- **Giao diện nhất quán**: Sử dụng cùng theme và style với hệ thống hiện tại

## Cấu trúc file

```
pos-frontend/src/pages/
├── Inventory.jsx          # Trang quản lý kho
├── MenuManagement.jsx     # Trang quản lý menu
├── More.jsx              # Trang trung tâm tính năng
└── index.js              # Export các trang

pos-frontend/src/components/shared/
└── BottomNav.jsx         # Cập nhật để thêm chức năng More

pos-frontend/src/App.jsx   # Thêm routes mới
```

## Hướng dẫn phát triển tiếp

### Thêm tính năng mới:
1. Tạo component mới trong `src/pages/`
2. Thêm route trong `App.jsx`
3. Thêm vào trang `More.jsx`
4. Export trong `pages/index.js`

### Tùy chỉnh giao diện:
- Sử dụng theme colors: `#1a1a1a`, `#262626`, `#F6B100`, `#ababab`
- Responsive design với Tailwind CSS
- Modal cho forms
- Loading states và error handling 