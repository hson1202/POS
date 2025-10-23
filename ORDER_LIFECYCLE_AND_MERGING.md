# Order Lifecycle and Merging Rules

## 🔄 Complete Order Flow

### Order States:
1. **Pending** - Món mới đặt, chưa làm
2. **In Progress** - Đang nấu/chuẩn bị
3. **Ready** - Món đã xong, chờ phục vụ
4. **Completed** - Đã thanh toán, kết thúc

---

## 📋 Order Merging Logic

### Rule: **Merge vào order hiện tại CHO TỚI KHI "Completed"**

```javascript
// Backend logic
orderStatus: { $nin: ["Completed", "completed"] } // Merge all except Completed
```

**Ý nghĩa:**
- ✅ Khách có thể đặt thêm món BẤT KỲ LÚC NÀO
- ✅ NGAY CẢ KHI món đang làm (In Progress)
- ✅ NGAY CẢ KHI món đã xong (Ready)
- ❌ CHỈ KHI nhân viên bấm **"Completed"** thì mới đóng order

---

## 🎭 Complete Scenario Flow

### Scenario: Bàn 5 - Gia đình 4 người ăn tối

#### 1. Đặt món lần 1 (19:00)
```
Customer: Đặt 2x Phở Bò, 1x Bún Chả
→ Backend: Tạo Order #001
→ Status: Pending
→ Total: ₹450
→ Kitchen: Nhận bill, bắt đầu làm
```

#### 2. Admin đổi status → In Progress (19:05)
```
Admin: Click "Start Cooking"
→ Order #001 status: In Progress
→ Kitchen đang nấu...
```

#### 3. Khách đặt thêm lần 2 (19:10) - Trong khi món đang làm!
```
Customer: Đặt thêm 2x Trà đá
→ Backend: Check existing order
→ Found Order #001 (Status: In Progress) ✅
→ Merge: 2x Trà đá vào Order #001
→ Total updated: ₹450 → ₹550
→ Kitchen: Nhận bill mới cho 2x Trà đá
→ Admin notification: "Table 5 added 2 more items"
```

#### 4. Món đầu xong → Ready (19:15)
```
Kitchen: Phở và Bún đã xong
Admin: Click "Mark as Ready"
→ Order #001 status: Ready
→ Staff mang món ra bàn 5
```

#### 5. Khách đặt thêm lần 3 (19:20) - Món đã ở bàn rồi!
```
Customer: Đặt thêm 1x Nem rán, 1x Chả giò
→ Backend: Check existing order
→ Found Order #001 (Status: Ready) ✅
→ Merge: Nem + Chả giò vào Order #001
→ Total updated: ₹550 → ₹750
→ Kitchen: Nhận bill cho Nem + Chả giò
→ Admin notification: "Table 5 added 2 more items"
```

#### 6. Món thêm xong (19:25)
```
Kitchen: Nem + Chả giò xong
Staff: Mang ra bàn 5
→ Order #001 vẫn status: Ready
→ Tất cả món đã ở bàn
```

#### 7. Khách ăn xong, gọi thanh toán (19:45)
```
Staff: Đến bàn 5
Customer: "Bill nhé!"
Staff: Check Order #001
→ Items: Phở x2, Bún, Trà x2, Nem, Chả giò
→ Total: ₹750
Customer: Thanh toán
Staff/Admin: Click "Mark as Completed" ✅
→ Order #001 status: Completed
→ Table 5: Available
```

#### 8. Khách mới ngồi bàn 5 (20:00)
```
New Customer: Scan QR bàn 5, đặt 1x Cơm gà
→ Backend: Check existing order
→ Found Order #001 (Status: Completed) ❌
→ Action: Tạo Order #002 MỚI ✅
→ Status: Pending
→ Kitchen: Nhận bill mới cho order mới
```

---

## 🎯 Key Points

### 1. Merge Continues Until "Completed"
```
Pending → Merge ✅
In Progress → Merge ✅
Ready → Merge ✅
Completed → NEW Order ✅
```

### 2. Why This Makes Sense?

#### Real-world scenario:
```
Khách: "Chờ món lâu quá, order thêm đồ uống đi!"
→ Món vẫn đang làm (In Progress)
→ Nhưng khách muốn order thêm
→ ✅ Merge vào order hiện tại (same session)
```

```
Khách: "Món đã ra rồi nhưng ngon quá, gọi thêm 2 phần nữa!"
→ Món đã Ready
→ Khách vẫn muốn thêm
→ ✅ Merge vào order hiện tại (same session)
```

```
Khách: "Đã thanh toán xong, về đây"
→ Order Completed
→ Khách mới ngồi vào bàn
→ ✅ Tạo order MỚI (new session)
```

### 3. Benefits:

#### For Restaurant:
- ✅ 1 bàn = 1 order = 1 bill duy nhất
- ✅ Dễ tracking tổng chi tiêu của khách
- ✅ Báo cáo chính xác (1 transaction per table session)

#### For Kitchen:
- ✅ Nhận bill riêng cho mỗi đợt order
- ✅ Biết rõ món nào làm trước, sau
- ✅ Không bị lẫn lộn

#### For Staff:
- ✅ Chỉ cần check 1 order duy nhất
- ✅ Thanh toán đơn giản
- ✅ Rõ ràng khi nào table "xong"

#### For Customer:
- ✅ Thoải mái order thêm bất cứ lúc nào
- ✅ Không lo nhầm bills
- ✅ Thanh toán 1 lần cho tất cả

---

## 💡 Edge Cases Handled

### Case 1: Khách order nhưng chưa kịp làm
```
19:00 - Order Phở (Pending)
19:02 - Order thêm Bún (Pending)
→ Merge vào same order ✅
→ Kitchen nhận 2 bills nhưng làm cùng lúc
```

### Case 2: Khách order trong khi đang nấu
```
19:00 - Order Phở (Pending)
19:05 - Admin: Start cooking (In Progress)
19:10 - Khách order thêm Trà (In Progress)
→ Merge ✅
→ Kitchen làm tiếp Trà
```

### Case 3: Khách order sau khi món đã ra
```
19:00 - Order Phở (Pending)
19:15 - Món xong (Ready)
19:20 - Khách thấy ngon, order thêm (Ready)
→ Merge ✅
→ Kitchen làm đợt mới
```

### Case 4: Khách ăn nhanh và order thêm
```
19:00 - Order Phở (Pending → In Progress → Ready)
19:25 - Khách ăn xong Phở
19:26 - Order thêm món tráng miệng (Ready)
→ Merge ✅ (vì chưa thanh toán)
```

### Case 5: Table turnover
```
19:00 - Khách A: Order + ăn + thanh toán (Completed)
19:45 - Khách B: Ngồi vào same table, order
→ NEW order ✅ (khách mới, session mới)
```

---

## 🔧 Technical Implementation

### Backend Query:
```javascript
const existingOrder = await Order.findOne({
  $or: [
    { table: tableIdentifier },
    { tableNumber: tableIdentifier }
  ],
  orderStatus: { $nin: ["Completed", "completed"] } // NOT Completed
}).sort({ createdAt: -1 });

if (existingOrder) {
  // MERGE: Append items to existing order
  existingOrder.items = [...existingOrder.items, ...newItems];
  existingOrder.totalAmount += newTotal;
  await existingOrder.save();
} else {
  // NEW: Create new order
  const newOrder = new Order(orderData);
  await newOrder.save();
}
```

### Key Logic:
- `$nin: ["Completed", "completed"]` = NOT IN (Completed)
- Means: Merge for **Pending, In Progress, Ready**
- Only create new when **no active order** OR **previous order completed**

---

## 📊 Comparison

### Old Logic (Pending only):
```
Time    Action                 Status        Result
19:00   Order Phở             Pending       Order #001 ✅
19:05   Start cooking         In Progress   -
19:10   Order Trà             In Progress   Order #002 ❌ (New!)
19:15   Ready                 Ready         -
19:20   Order Nem             Ready         Order #003 ❌ (New!)
Result: 3 orders for 1 table session ❌
```

### New Logic (Until Completed):
```
Time    Action                 Status        Result
19:00   Order Phở             Pending       Order #001 ✅
19:05   Start cooking         In Progress   -
19:10   Order Trà             In Progress   Merge → #001 ✅
19:15   Ready                 Ready         -
19:20   Order Nem             Ready         Merge → #001 ✅
19:45   Complete & pay        Completed     -
20:00   New customer          -             Order #002 ✅ (New session)
Result: 1 order per table session ✅
```

---

## 🎯 Summary

### The Rule:
> **Một bàn chỉ có một order active cho tới khi nhân viên bấm "Completed"**

### The Flow:
```
Customer orders → Pending
↓
Kitchen cooks → In Progress (can still add items ✅)
↓
Food ready → Ready (can still add items ✅)
↓
Customer pays → Staff clicks "Completed"
↓
Next customer → NEW order
```

### The Benefits:
- ✅ Simple for everyone
- ✅ One order per dining session
- ✅ Easy payment
- ✅ Clear lifecycle
- ✅ Accurate reporting

### The Implementation:
```javascript
// Simple query
orderStatus: { $nin: ["Completed"] }

// That's it! Everything else is automatic.
```

---

## 🚀 Next Steps

1. **Restart backend** để apply changes
2. **Test thoroughly** với các scenarios trên
3. **Train staff**: Chỉ bấm "Completed" khi khách thanh toán xong
4. **Monitor**: Quan sát behavior trong vài ngày đầu
5. **Adjust**: Tweak nếu cần based on real usage

## ✨ Result

**Simple, intuitive, và match với real-world restaurant operations!**

