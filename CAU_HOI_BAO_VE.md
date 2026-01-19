# CÂU HỎI BẢO VỆ ĐỒ ÁN - HỆ THỐNG QUẢN LÝ KHO

## PHẦN 1: KIẾN TRÚC VÀ THIẾT KẾ HỆ THỐNG

### Câu 1: Hãy mô tả kiến trúc tổng thể của hệ thống quản lý kho này?

**Trả lời:**
Hệ thống được xây dựng theo kiến trúc **3-tier**:
- **Frontend**: React + TypeScript + Vite, sử dụng React Query cho state management
- **Backend**: ASP.NET Core 6.0 Web API (C#), Entity Framework Core
- **Database**: SQL Server

**Tính năng chính:**
- Quản lý nhập kho (Receiving)
- Quản lý xuất kho (Picking) với logic FIFO
- Quản lý tồn kho (Inventory) với tracking serial numbers
- Kiểm kê kho (Stock Take)
- Quản lý sản phẩm, danh mục, đối tác
- Authentication & Authorization (JWT, Role-based)
- Password reset workflow

**Tham khảo code:**
- `warehouse-api-main/Program.cs` - Cấu hình backend
- `warehouse-client-main/src/App.tsx` - Routing frontend

---

### Câu 2: Tại sao bạn chọn Entity Framework Core thay vì ADO.NET thuần?

**Trả lời:**
- **Code-first approach**: Tạo model trước, EF Core tự động tạo database schema
- **LINQ queries**: Viết query dễ đọc, type-safe, IntelliSense hỗ trợ tốt
- **Change tracking**: Tự động theo dõi thay đổi entities, giảm code boilerplate
- **Migration support**: Quản lý schema changes dễ dàng qua migrations
- **Relationship management**: Tự động quản lý foreign keys, navigation properties

**Ví dụ:**
```csharp
// EF Core - Dễ đọc, type-safe
var orders = await _db.PickingOrders
    .Include(p => p.PickingDetails)
        .ThenInclude(d => d.Product)
    .Where(p => p.Status == "Completed")
    .ToListAsync();

// ADO.NET - Phức tạp hơn, dễ lỗi
// SELECT * FROM PickingOrders p 
// JOIN PickingDetails d ON p.PickingOrderId = d.PickingOrderId
// WHERE p.Status = @status
```

**Tham khảo code:**
- `warehouse-api-main/Models/WmsDbContext.cs` - DbContext configuration
- `warehouse-api-main/Controllers/PickingController.cs` - Sử dụng EF Core queries

---

### Câu 3: Hệ thống xử lý authentication và authorization như thế nào?

**Trả lời:**
- **Authentication**: JWT (JSON Web Token)
  - User login → Server tạo JWT token chứa UserId, Role
  - Token được lưu trong localStorage (frontend)
  - Mỗi request gửi kèm token trong header `Authorization: Bearer {token}`

- **Authorization**: Role-based (Admin, User)
  - `[Authorize(Roles = "Admin")]` - Chỉ Admin truy cập được
  - `[Authorize]` - Cần đăng nhập

**Flow:**
1. User đăng nhập → `AuthController.Login`
2. Server verify credentials → Tạo JWT token
3. Frontend lưu token → Gửi kèm mọi request
4. Middleware verify token → Cho phép/Chặn request

**Tham khảo code:**
- `warehouse-api-main/Controllers/AuthController.cs` - Login endpoint
- `warehouse-api-main/Program.cs` - JWT configuration
- `warehouse-client-main/src/services/auth.service.ts` - Frontend auth logic

---

## PHẦN 2: DATABASE VÀ QUAN HỆ DỮ LIỆU

### Câu 4: Hãy giải thích mối quan hệ giữa các bảng chính trong database?

**Trả lời:**

**Các bảng chính và quan hệ:**

1. **Users** (1) → (N) **PickingOrders** (Tạo phiếu xuất)
2. **Users** (1) → (N) **Receivings** (Tạo phiếu nhập)
3. **Products** (1) → (N) **PickingDetails** (Sản phẩm trong phiếu xuất)
4. **Products** (1) → (N) **ReceivingDetails** (Sản phẩm trong phiếu nhập)
5. **Products** (1) → (N) **ProductSeries** (Serial numbers của sản phẩm)
6. **PickingDetails** (1) → (N) **PickingSerialDetails** (Serial numbers đã xuất)
7. **ReceivingDetails** (1) → (N) **InventoryDetails** (Lô hàng nhập vào kho)
8. **InventoryDetails** (1) → (N) **ProductSeries** (Serial numbers thuộc lô hàng)

**Cascade Delete:**
- Xóa `PickingOrder` → Xóa `PickingDetails` → Xóa `PickingSerialDetails`
- Xóa `Receiving` → Xóa `ReceivingDetails` → Không xóa `InventoryDetails` (giữ lại lịch sử)

**Tham khảo code:**
- `warehouse-api-main/Models/WmsDbContext.cs` - OnModelCreating method

---

### Câu 5: Tại sao bạn sử dụng ON DELETE NO ACTION thay vì CASCADE cho một số foreign keys?

**Trả lời:**
SQL Server không cho phép **multiple cascade paths** (nhiều đường cascade từ cùng một bảng).

**Ví dụ vấn đề:**
```
Users → PasswordResetRequests (UserId) - CASCADE
Users → PasswordResetRequests (ProcessedByUserId) - CASCADE
```
→ SQL Server báo lỗi: "may cause cycles or multiple cascade paths"

**Giải pháp:**
- Dùng `ON DELETE NO ACTION` cho foreign keys có multiple paths
- Xử lý xóa thủ công trong code nếu cần

**Tham khảo code:**
- `warehouse-api-main/Models/WmsDbContext.cs` - PasswordResetRequest configuration
- `warehouse-api-main/Migrations/CreatePasswordResetRequestsTable.sql` - SQL script

---

### Câu 6: Bảng ProductSeries và PickingSerialDetail khác nhau như thế nào?

**Trả lời:**

**ProductSeries:**
- Lưu **tất cả serial numbers** của sản phẩm trong kho
- Trạng thái: `InStock`, `Picked`, `Damaged`
- Có `PickedDate` khi được xuất kho
- Có `PickingDetailId` khi được gán vào phiếu xuất

**PickingSerialDetail:**
- Lưu **lịch sử xuất kho** - serial numbers đã được xuất trong phiếu xuất cụ thể
- Tạo khi hoàn tất phiếu xuất (Complete picking order)
- Dùng để **audit trail** - biết serial nào đã xuất khi nào, trong phiếu nào

**Mối quan hệ:**
- `PickingSerialDetail.ProductSeriesId` → `ProductSeries.ProductSeriesId`
- Khi xuất kho: Tạo `PickingSerialDetail` + Cập nhật `ProductSeries.Status = "Picked"`

**Tham khảo code:**
- `warehouse-api-main/Models/ProductSeries.cs`
- `warehouse-api-main/Models/PickingSerialDetail.cs`
- `warehouse-api-main/Controllers/PickingController.cs` - Complete method

---

## PHẦN 3: LOGIC NGHIỆP VỤ

### Câu 7: Hãy giải thích logic FIFO (First-In-First-Out) trong xuất kho?

**Trả lời:**
FIFO = Sản phẩm nhập trước → Xuất trước (để tránh hàng hết hạn).

**Cách implement:**

1. **Khi tạo phiếu xuất**: Chỉ chọn sản phẩm, số lượng
2. **Khi hoàn tất phiếu xuất** (`Complete`):
   - Với sản phẩm **có serial numbers**:
     - Query `ProductSeries` với `Status = "InStock"`, `PickedDate = null`
     - Sắp xếp theo `ReceivedDate ASC` (nhập trước → ưu tiên)
     - Lấy đủ số lượng cần → Cập nhật `Status = "Picked"`, `PickedDate = now`
   - Với sản phẩm **không có serial numbers**:
     - Query `InventoryDetails` với `QuantityRemaining > 0`
     - Sắp xếp theo `ReceivedDate ASC`
     - Trừ `QuantityRemaining` theo FIFO

**Ví dụ code:**
```csharp
// FIFO cho serial numbers
var serialsToPick = await _db.ProductSeries
    .Where(ps => ps.ProductId == productId 
        && ps.Status == "InStock" 
        && ps.PickedDate == null
        && ps.PickingDetailId == null)
    .OrderBy(ps => ps.ReceivedDate) // FIFO: Nhập trước → Xuất trước
    .Take(quantity)
    .ToListAsync();
```

**Tham khảo code:**
- `warehouse-api-main/Controllers/PickingController.cs` - Complete method (dòng 400-600)

---

### Câu 8: Hệ thống xử lý nhập kho như thế nào?

**Trả lời:**

**Flow nhập kho:**

1. **Tạo phiếu nhập** (`ReceivingController.Create`):
   - Tạo `Receiving` record
   - Tạo `ReceivingDetail` records (sản phẩm, số lượng, giá)
   - Lưu vào database

2. **Khi nhập kho** (có thể tự động hoặc manual):
   - Tạo `InventoryDetail` records (lô hàng trong kho)
   - Nếu sản phẩm có serial numbers:
     - Tạo `ProductSeries` records cho từng serial number
     - Gán `ReceivedDate`, `Status = "InStock"`

**Tối ưu:**
- Dùng `AddRange()` thay vì `Add()` trong loop
- Chỉ gọi `SaveChangesAsync()` 2 lần (thay vì N+1 lần)

**Tham khảo code:**
- `warehouse-api-main/Controllers/ReceivingController.cs` - Create method

---

### Câu 9: Hệ thống tracking tồn kho (Inventory) hoạt động như thế nào?

**Trả lời:**

**Cấu trúc:**
- **InventoryDetail**: Lưu từng **lô hàng** (lot) trong kho
  - `QuantityIn`: Số lượng nhập ban đầu
  - `QuantityRemaining`: Số lượng còn lại
  - `ReceivedDate`: Ngày nhập
  - `Price`: Giá nhập

- **InventoryLog**: Lưu **lịch sử thay đổi** tồn kho
  - Mỗi khi xuất/nhập → Tạo log record

**Cách tính tồn kho:**
- Tổng tồn = Sum(`QuantityRemaining`) của tất cả `InventoryDetails`
- Có thể group theo ProductId để có tồn kho theo sản phẩm

**Tối ưu:**
- `GetSummary` dùng database aggregation thay vì load tất cả vào memory:
```csharp
var summary = await _db.InventoryDetails
    .GroupBy(id => id.ProductId)
    .Select(g => new {
        ProductId = g.Key,
        TotalQuantity = g.Sum(id => id.QuantityRemaining)
    })
    .ToListAsync();
```

**Tham khảo code:**
- `warehouse-api-main/Controllers/InventoryController.cs` - GetSummary method

---

### Câu 10: Password reset workflow được thiết kế như thế nào?

**Trả lời:**

**Flow:**
1. **User gửi request** (`AuthController.RequestPasswordReset`):
   - Nhập `loginInfo` (username hoặc employee code)
   - Tạo `PasswordResetRequest` với `Status = "Pending"`

2. **Admin xem requests** (`UserController.GetPasswordResetRequests`):
   - Filter theo status (Pending, Approved, Rejected)

3. **Admin xử lý** (`UserController.ProcessPasswordResetRequest`):
   - Approve → Reset password về mặc định (ví dụ: "123456")
   - Reject → Cập nhật `Status = "Rejected"`

**Bảo mật:**
- Chỉ Admin mới có thể process requests
- User không thể tự reset password trực tiếp

**Tham khảo code:**
- `warehouse-api-main/Controllers/AuthController.cs` - RequestPasswordReset
- `warehouse-api-main/Controllers/UserControllers.cs` - ProcessPasswordResetRequest
- `warehouse-client-main/src/pages/admin/password-reset/PasswordResetRequests.tsx`

---

## PHẦN 4: TỐI ƯU HÓA VÀ PERFORMANCE

### Câu 11: Bạn đã tối ưu N+1 query problem như thế nào?

**Trả lời:**

**N+1 Problem:**
```csharp
// ❌ BAD: N+1 queries
var orders = await _db.PickingOrders.ToListAsync(); // 1 query
foreach (var order in orders) {
    var details = await _db.PickingDetails
        .Where(d => d.PickingOrderId == order.PickingOrderId)
        .ToListAsync(); // N queries
}
```

**Giải pháp:**
```csharp
// ✅ GOOD: 1 query với Include
var orders = await _db.PickingOrders
    .Include(p => p.PickingDetails)
        .ThenInclude(d => d.Product)
    .Include(p => p.PickingDetails)
        .ThenInclude(d => d.PickingSerialDetails)
    .ToListAsync(); // Chỉ 1 query
```

**Kết quả:**
- Trước: 1 + N queries (N = số orders)
- Sau: 1 query duy nhất

**Tham khảo code:**
- `warehouse-api-main/Controllers/PickingController.cs` - GetAll method (dòng 31-42)

---

### Câu 12: Tại sao bạn giảm số lần gọi SaveChangesAsync()?

**Trả lời:**

**Vấn đề:**
```csharp
// ❌ BAD: N+1 SaveChangesAsync
foreach (var item in items) {
    _db.Items.Add(item);
    await _db.SaveChangesAsync(); // N lần
}
```

**Giải pháp:**
```csharp
// ✅ GOOD: 1 lần SaveChangesAsync
_db.Items.AddRange(items);
await _db.SaveChangesAsync(); // 1 lần
```

**Lợi ích:**
- **Performance**: Nhanh hơn (1 transaction thay vì N transactions)
- **Atomicity**: Tất cả hoặc không gì cả (rollback nếu lỗi)
- **Consistency**: Đảm bảo data consistency

**Tham khảo code:**
- `warehouse-api-main/Controllers/ReceivingController.cs` - Create method

---

### Câu 13: Pagination được implement như thế nào?

**Trả lời:**

**Backend:**
```csharp
[HttpGet]
public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
{
    var totalCount = await _db.Orders.CountAsync();
    
    var orders = await _db.Orders
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
    
    return Ok(new {
        data = orders,
        pagination = new {
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        }
    });
}
```

**Frontend:**
- React Query để fetch data
- UI hiển thị page numbers, prev/next buttons
- Backward compatible: Nếu không có pagination params → trả về tất cả

**Lợi ích:**
- Giảm memory usage
- Tăng tốc độ response
- Better UX (không phải load tất cả data)

**Tham khảo code:**
- `warehouse-api-main/Controllers/PickingController.cs` - GetAll
- `warehouse-client-main/src/pages/user/phieuxuat/Xuathang.tsx` - Pagination UI

---

### Câu 14: AsNoTracking() được sử dụng khi nào?

**Trả lời:**

**AsNoTracking():**
- EF Core **không track changes** của entities
- Dùng cho **read-only queries** (GET requests)
- **Performance**: Nhanh hơn vì không cần maintain change tracker

**Khi nào dùng:**
- ✅ GET requests (chỉ đọc data)
- ❌ Không dùng khi cần UPDATE/DELETE entities

**Ví dụ:**
```csharp
// ✅ Read-only query
var orders = await _db.PickingOrders
    .AsNoTracking() // Không track changes
    .ToListAsync();

// ❌ Cần track changes để update
var order = await _db.PickingOrders
    .FirstOrDefaultAsync(o => o.PickingOrderId == id);
order.Status = "Completed";
await _db.SaveChangesAsync(); // Cần track để EF Core biết thay đổi
```

**Tham khảo code:**
- `warehouse-api-main/Controllers/PickingController.cs` - GetAll (dòng 38)

---

## PHẦN 5: FRONTEND VÀ UX

### Câu 15: React Query được sử dụng để làm gì?

**Trả lời:**

**React Query (TanStack Query)** dùng để:
- **Server state management**: Quản lý data từ API
- **Caching**: Tự động cache responses
- **Refetching**: Tự động refetch khi focus window, reconnect
- **Loading/Error states**: Built-in loading và error handling
- **Optimistic updates**: Update UI trước khi API response

**Ví dụ:**
```typescript
const { data, isLoading, error } = useQuery(
  ['picking-orders', page],
  () => pickingService.getAll(page, pageSize),
  {
    staleTime: 30000, // Cache 30s
    refetchOnWindowFocus: true
  }
);
```

**Lợi ích:**
- Giảm boilerplate code
- Better UX (loading states, error handling)
- Automatic caching và refetching

**Tham khảo code:**
- `warehouse-client-main/src/pages/user/phieuxuat/Xuathang.tsx`

---

### Câu 16: TypeScript được sử dụng như thế nào trong dự án?

**Trả lời:**

**TypeScript benefits:**
- **Type safety**: Compile-time error checking
- **IntelliSense**: Auto-complete, better developer experience
- **Refactoring**: Dễ refactor code (IDE biết tất cả usages)
- **Documentation**: Types là documentation tự động

**Cấu trúc:**
- `types.ts`: Định nghĩa tất cả interfaces/types
- Services: Type-safe API calls
- Components: Props và state có types

**Ví dụ:**
```typescript
interface PickingOrderDTO {
  pickingOrderId: number;
  orderCode: string;
  status: string;
  pickedDate?: string;
}

// Type-safe function
function getOrder(id: number): Promise<PickingOrderDTO> {
  return api.get(`/api/Picking/${id}`);
}
```

**Tham khảo code:**
- `warehouse-client-main/src/types.ts`
- `warehouse-client-main/src/services/picking.service.ts`

---

### Câu 17: Responsive design được implement như thế nào?

**Trả lời:**

**Tailwind CSS** với responsive breakpoints:
- `sm:` - Small screens (≥640px)
- `md:` - Medium screens (≥768px)
- `lg:` - Large screens (≥1024px)

**Ví dụ:**
```tsx
{/* Desktop table */}
<div className="hidden sm:block">
  <table>...</table>
</div>

{/* Mobile cards */}
<div className="sm:hidden">
  <div className="card">...</div>
</div>
```

**Components:**
- Desktop: Table view
- Mobile: Card view với thông tin được tổ chức lại

**Tham khảo code:**
- `warehouse-client-main/src/pages/user/phieuxuat/PickingDetailModal.tsx` - Desktop table và mobile cards

---

## PHẦN 6: ERROR HANDLING VÀ VALIDATION

### Câu 18: Hệ thống xử lý lỗi như thế nào?

**Trả lời:**

**Backend:**
- **Try-catch blocks**: Bắt exceptions
- **Logging**: Ghi log lỗi (ILogger)
- **Error responses**: Trả về JSON với error message
```csharp
try {
    // ...
} catch (Exception ex) {
    _logger.LogError(ex, "Error message");
    return StatusCode(500, new {
        error = true,
        message = "An error occurred",
        detail = ex.Message
    });
}
```

**Frontend:**
- **React Query**: Tự động handle errors
- **Error boundaries**: Catch component errors
- **User-friendly messages**: Hiển thị lỗi dễ hiểu cho user

**Tham khảo code:**
- `warehouse-api-main/Controllers/PickingController.cs` - Error handling
- `warehouse-client-main/src/utils/api-client.ts` - Error interceptor

---

### Câu 19: Validation được thực hiện ở đâu?

**Trả lời:**

**Backend:**
- **Data Annotations**: `[Required]`, `[Range]`, `[EmailAddress]`
- **ModelState validation**: Tự động validate khi `[FromBody]`
- **Manual validation**: Check business rules trong controller

**Frontend:**
- **Form validation**: Check trước khi submit
- **TypeScript types**: Compile-time validation
- **User feedback**: Hiển thị validation errors

**Ví dụ:**
```csharp
public class CreateReceivingDTO
{
    [Required]
    public int PartnerId { get; set; }
    
    [Required]
    [MinLength(1)]
    public List<ReceivingDetailDTO> Details { get; set; }
}
```

**Tham khảo code:**
- `warehouse-api-main/DTO/ReceivingCreateDTO.cs`
- `warehouse-api-main/Controllers/ReceivingController.cs` - ModelState check

---

## PHẦN 7: TESTING VÀ DEPLOYMENT

### Câu 20: Bạn sẽ test hệ thống này như thế nào?

**Trả lời:**

**Unit Tests:**
- Test business logic (FIFO, inventory calculation)
- Test controllers với mock DbContext
- Test services với mock dependencies

**Integration Tests:**
- Test API endpoints với test database
- Test database operations (CRUD)
- Test authentication/authorization

**Manual Testing:**
- Test các flow chính:
  - Nhập kho → Tồn kho tăng
  - Xuất kho → Tồn kho giảm, FIFO đúng
  - Kiểm kê → So sánh thực tế vs hệ thống
- Test edge cases:
  - Xuất quá số lượng tồn kho
  - Serial number đã được xuất rồi
  - Concurrent updates

**Tools:**
- xUnit (C#), Jest (TypeScript)
- Postman/Swagger (API testing)
- SQL Server Profiler (Database query analysis)

---

## CÂU HỎI BỔ SUNG (BONUS)

### Câu 21: Nếu cần scale hệ thống lên, bạn sẽ làm gì?

**Trả lời:**
- **Database**: 
  - Indexing cho các columns thường query
  - Read replicas cho read-heavy operations
  - Partitioning cho bảng lớn
- **Backend**:
  - Load balancing (multiple API servers)
  - Caching (Redis) cho frequently accessed data
  - Async processing cho heavy operations
- **Frontend**:
  - CDN cho static assets
  - Code splitting, lazy loading
- **Monitoring**:
  - Application Insights, logging
  - Performance metrics

---

### Câu 22: Bảo mật được đảm bảo như thế nào?

**Trả lời:**
- **Authentication**: JWT tokens
- **Authorization**: Role-based access control
- **SQL Injection**: EF Core parameterized queries (tự động)
- **XSS**: React tự động escape
- **CORS**: Configured trong Program.cs
- **Password**: Hash (BCrypt) trước khi lưu
- **HTTPS**: Enforce trong production

---

### Câu 23: Migration được quản lý như thế nào?

**Trả lời:**
- **EF Core Migrations**:
  - `dotnet ef migrations add MigrationName`
  - `dotnet ef database update`
- **Manual SQL scripts**: Khi migration không đủ (ví dụ: complex constraints)
- **Version control**: Migrations được commit vào Git
- **Rollback**: Có thể rollback migration nếu cần

**Tham khảo code:**
- `warehouse-api-main/Migrations/` - Tất cả migration files

---

### Câu 24: Nếu có conflict khi nhiều user cùng update một record, bạn xử lý như thế nào?

**Trả lời:**
- **Optimistic concurrency**: Dùng `RowVersion` hoặc timestamp
- **Pessimistic locking**: Lock record khi đang edit (ít dùng)
- **Transaction isolation**: Đảm bảo data consistency
- **Retry logic**: Retry nếu có conflict

**Ví dụ:**
```csharp
try {
    // Update với RowVersion check
    await _db.SaveChangesAsync();
} catch (DbUpdateConcurrencyException) {
    // Conflict detected → Retry hoặc notify user
}
```

---

## KẾT LUẬN

File này chứa **20 câu hỏi chính** và **4 câu hỏi bonus** về:
- Kiến trúc hệ thống
- Database design và relationships
- Business logic (FIFO, Inventory tracking)
- Performance optimization
- Frontend development
- Error handling và validation
- Testing và deployment

Mỗi câu hỏi đều có:
- ✅ Câu trả lời chi tiết
- ✅ Code examples
- ✅ Tham khảo file cụ thể trong project

**Lưu ý**: Hãy đọc kỹ code trong các file được tham khảo để hiểu sâu hơn và có thể trả lời các câu hỏi follow-up từ giảng viên.
