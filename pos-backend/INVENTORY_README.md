# Hệ thống Quản lý Kho và Món ăn - Restaurant POS

## Tổng quan

Hệ thống này cung cấp tính năng quản lý kho nguyên liệu và món ăn với công thức chi tiết, tự động trừ kho khi bán hàng và tính thuế cho từng món ăn.

## Tính năng chính

### 1. Quản lý Nguyên liệu (Ingredients)
- ✅ Thêm, sửa, xóa nguyên liệu
- ✅ Phân loại nguyên liệu theo danh mục
- ✅ Theo dõi số lượng tồn kho
- ✅ Thiết lập mức tồn kho tối thiểu
- ✅ Quản lý nhà cung cấp và giá nguyên liệu

### 2. Quản lý Món ăn (Menu Items)
- ✅ Tạo món ăn với công thức chi tiết
- ✅ Tính thuế cho từng món ăn
- ✅ Thông tin dinh dưỡng và chất gây dị ứng
- ✅ Kiểm tra khả năng chế biến dựa trên kho

### 3. Quản lý Kho (Inventory Management)
- ✅ Tự động trừ kho khi tạo đơn hàng
- ✅ Lịch sử giao dịch kho (nhập/xuất)
- ✅ Cảnh báo nguyên liệu sắp hết
- ✅ Báo cáo món ăn không khả dụng

## Cài đặt và Chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env` từ `env-template.txt` và cấu hình:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 3. Tạo dữ liệu mẫu
```bash
npm run seed
```

### 4. Chạy server
```bash
npm run dev
```

## API Endpoints

### Quản lý Nguyên liệu

#### Lấy danh sách nguyên liệu
```
GET /api/ingredients
```

#### Lấy nguyên liệu theo danh mục
```
GET /api/ingredients/category/:category
```

#### Tạo nguyên liệu mới
```
POST /api/ingredients
Content-Type: application/json

{
  "name": "Thịt bò",
  "category": "Thịt",
  "unit": "g",
  "currentStock": 5000,
  "minStock": 1000,
  "pricePerUnit": 0.2,
  "supplier": "Nhà cung cấp ABC",
  "description": "Thịt bò tươi ngon"
}
```

#### Cập nhật nguyên liệu
```
PUT /api/ingredients/:id
```

#### Xóa nguyên liệu
```
DELETE /api/ingredients/:id
```

#### Nhập kho
```
POST /api/ingredients/stock/add
Content-Type: application/json

{
  "ingredientId": "ingredient_id",
  "quantity": 1000,
  "unitPrice": 0.2,
  "supplier": "Nhà cung cấp ABC",
  "notes": "Nhập kho tháng 12"
}
```

#### Xuất kho
```
POST /api/ingredients/stock/reduce
Content-Type: application/json

{
  "ingredientId": "ingredient_id",
  "quantity": 500,
  "reason": "SALE",
  "notes": "Xuất kho cho món ăn"
}
```

#### Lấy lịch sử kho
```
GET /api/ingredients/history?ingredientId=id&startDate=2024-01-01&endDate=2024-12-31
```

#### Kiểm tra nguyên liệu sắp hết
```
GET /api/ingredients/low-stock
```

### Quản lý Món ăn

#### Lấy danh sách món ăn
```
GET /api/menu-items
```

#### Lấy món ăn theo danh mục
```
GET /api/menu-items/category/:category
```

#### Tạo món ăn mới
```
POST /api/menu-items
Content-Type: application/json

{
  "name": "Mì xào bò",
  "category": "Món chính",
  "description": "Mì xào với thịt bò tươi ngon",
  "price": 45000,
  "taxRate": 10,
  "image": "/images/mi-xao-bo.jpg",
  "preparationTime": 15,
  "isVegetarian": false,
  "isSpicy": false,
  "allergens": ["Gluten"],
  "nutritionalInfo": {
    "calories": 650,
    "protein": 35,
    "carbs": 45,
    "fat": 25
  },
  "recipe": [
    {
      "ingredient": "ingredient_id_1",
      "quantity": 200
    },
    {
      "ingredient": "ingredient_id_2", 
      "quantity": 150
    }
  ]
}
```

#### Cập nhật món ăn
```
PUT /api/menu-items/:id
```

#### Xóa món ăn
```
DELETE /api/menu-items/:id
```

#### Kiểm tra khả năng chế biến
```
GET /api/menu-items/:menuItemId/availability
```

#### Tính giá món ăn với thuế
```
GET /api/menu-items/:menuItemId/price/:quantity
```

#### Xuất kho khi chế biến
```
POST /api/menu-items/consume-ingredients
Content-Type: application/json

{
  "menuItemId": "menu_item_id",
  "quantity": 2,
  "orderId": "order_id"
}
```

#### Lấy món ăn không khả dụng
```
GET /api/menu-items/unavailable
```

## Cấu trúc Dữ liệu

### Nguyên liệu (Ingredient)
```javascript
{
  name: String,           // Tên nguyên liệu
  category: String,       // Danh mục: Thịt, Rau củ, Gia vị, Ngũ cốc, Hải sản, Trứng sữa, Khác
  unit: String,          // Đơn vị: g, kg, ml, l, cái, bó, gói, hộp
  currentStock: Number,  // Số lượng hiện tại
  minStock: Number,      // Số lượng tối thiểu
  pricePerUnit: Number,  // Giá trên đơn vị
  supplier: String,      // Nhà cung cấp
  description: String,   // Mô tả
  isActive: Boolean      // Trạng thái hoạt động
}
```

### Món ăn (MenuItem)
```javascript
{
  name: String,                    // Tên món ăn
  category: String,                // Danh mục: Món chính, Món khai vị, Món tráng miệng, Đồ uống, Món ăn nhanh
  description: String,             // Mô tả
  price: Number,                   // Giá gốc
  taxRate: Number,                 // Tỷ lệ thuế (%)
  priceWithTax: Number,            // Giá sau thuế (tự động tính)
  image: String,                   // Hình ảnh
  recipe: [{                       // Công thức
    ingredient: ObjectId,          // ID nguyên liệu
    quantity: Number               // Số lượng cần
  }],
  preparationTime: Number,         // Thời gian chế biến (phút)
  isAvailable: Boolean,            // Có sẵn không
  isVegetarian: Boolean,           // Món chay
  isSpicy: Boolean,                // Món cay
  allergens: [String],             // Chất gây dị ứng
  nutritionalInfo: {               // Thông tin dinh dưỡng
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
}
```

### Giao dịch Kho (StockTransaction)
```javascript
{
  ingredient: ObjectId,            // ID nguyên liệu
  type: String,                    // Loại: IN (nhập), OUT (xuất)
  quantity: Number,                // Số lượng
  unitPrice: Number,               // Giá đơn vị
  totalAmount: Number,             // Tổng tiền
  reason: String,                  // Lý do: PURCHASE, SALE, ADJUSTMENT, WASTE, TRANSFER
  reference: String,               // Tham chiếu
  notes: String,                   // Ghi chú
  performedBy: ObjectId,           // Người thực hiện
  previousStock: Number,           // Số lượng trước
  newStock: Number                 // Số lượng sau
}
```

## Ví dụ Sử dụng

### 1. Tạo nguyên liệu "Thịt bò"
```bash
curl -X POST http://localhost:5000/api/ingredients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Thịt bò",
    "category": "Thịt",
    "unit": "g",
    "currentStock": 5000,
    "minStock": 1000,
    "pricePerUnit": 0.2,
    "supplier": "Nhà cung cấp ABC",
    "description": "Thịt bò tươi ngon"
  }'
```

### 2. Tạo món ăn "Mì xào bò"
```bash
curl -X POST http://localhost:5000/api/menu-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Mì xào bò",
    "category": "Món chính",
    "description": "Mì xào với thịt bò tươi ngon",
    "price": 45000,
    "taxRate": 10,
    "recipe": [
      {"ingredient": "INGREDIENT_ID_1", "quantity": 200},
      {"ingredient": "INGREDIENT_ID_2", "quantity": 150}
    ]
  }'
```

### 3. Kiểm tra khả năng chế biến
```bash
curl -X GET http://localhost:5000/api/menu-items/MENU_ITEM_ID/availability \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Nhập kho nguyên liệu
```bash
curl -X POST http://localhost:5000/api/ingredients/stock/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "ingredientId": "INGREDIENT_ID",
    "quantity": 1000,
    "unitPrice": 0.2,
    "supplier": "Nhà cung cấp ABC"
  }'
```

## Lưu ý quan trọng

1. **Xác thực**: Tất cả API endpoints đều yêu cầu JWT token
2. **Tự động trừ kho**: Khi tạo đơn hàng, hệ thống tự động kiểm tra và trừ kho nguyên liệu
3. **Tính thuế**: Mỗi món ăn có thể có tỷ lệ thuế khác nhau
4. **Cảnh báo**: Hệ thống tự động cảnh báo khi nguyên liệu sắp hết
5. **Lịch sử**: Mọi giao dịch kho đều được ghi lại để theo dõi

## Troubleshooting

### Lỗi thường gặp

1. **"Không đủ nguyên liệu"**: Kiểm tra số lượng trong kho và nhập thêm nguyên liệu
2. **"Món ăn không khả dụng"**: Cập nhật công thức hoặc nhập thêm nguyên liệu thiếu
3. **"Lỗi kết nối database"**: Kiểm tra cấu hình MongoDB trong file .env

### Debug

Để debug, kiểm tra logs trong console hoặc sử dụng các endpoint kiểm tra:
- `/api/ingredients/low-stock` - Kiểm tra nguyên liệu sắp hết
- `/api/menu-items/unavailable` - Kiểm tra món ăn không khả dụng
- `/api/ingredients/history` - Xem lịch sử giao dịch kho 