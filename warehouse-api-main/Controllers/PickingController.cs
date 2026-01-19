using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.Models;
using WMS1.DTO;
using Microsoft.Extensions.Logging;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PickingController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private readonly ILogger<PickingController> _logger;

        public PickingController(WmsDbContext db, ILogger<PickingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // ✅ Tối ưu: Thêm pagination để tránh load quá nhiều data
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50; // Giới hạn tối đa 100 items/page

            var totalCount = await _db.PickingOrders.CountAsync();
            
            var orders = await _db.PickingOrders
                .Include(p => p.CreateByUser)
                .Include(p => p.Partner)
                .Include(p => p.PickingDetails)
                    .ThenInclude(d => d.Product)
                .Include(p => p.PickingDetails)
                    .ThenInclude(d => d.PickingSerialDetails)
                .AsNoTracking() // Read-only query
                .OrderByDescending(p => p.CreateDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = orders.Select(p => new PickingOrderResponse
            {
                PickingOrderId = p.PickingOrderId,
                OrderCode = p.OrderCode,
                CreateByUserId = p.CreateByUserId,
                CreateDate = p.CreateDate,
                Status = p.Status,
                // Lấy ngày xuất từ serial number đầu tiên (nếu có)
                PickedDate = p.PickingDetails
                    .SelectMany(d => d.PickingSerialDetails)
                    .Where(psd => psd.PickedDate != null)
                    .OrderBy(psd => psd.PickedDate)
                    .Select(psd => psd.PickedDate)
                    .FirstOrDefault(),
                PartnerId = p.PartnerId,
                PartnerName = p.Partner?.PartnerName ?? "",
                CreateByUser = new UserInfo
                {
                    UserId = p.CreateByUser.UserId,
                    UserName = p.CreateByUser.UserName ?? "",
                    FullName = p.CreateByUser.FullName ?? "",
                    Email = p.CreateByUser.Email ?? ""
                },
                Details = p.PickingDetails.Select(d => new PickingDetailResponse
                {
                    PickingDetailId = d.PickingDetailId,
                    ProductId = d.ProductId,
                    ProductCode = d.Product.ProductCode,
                    ProductName = d.Product.ProductName,
                    QuantityPicked = d.QuantityPicked,
                    UnitPrice = d.UnitPrice,
                    SerialNumbers = d.SerialNumbers,
                    SerialNumberDetails = d.PickingSerialDetails.Select(psd => new SerialNumberInfo
                    {
                        ProductSeriesId = psd.ProductSeriesId,
                        SerialNumber = psd.SerialNumber,
                        Status = psd.Status,
                        PickedDate = psd.PickedDate
                    }).ToList()
                }).ToList()
            }).ToList();

            return Ok(new
            {
                data = result,
                pagination = new
                {
                    page = page,
                    pageSize = pageSize,
                    totalCount = totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _db.PickingOrders
                .Include(p => p.CreateByUser)
                .Include(p => p.Partner)
                .Include(p => p.PickingDetails)
                    .ThenInclude(d => d.Product)
                .Include(p => p.PickingDetails)
                    .ThenInclude(d => d.PickingSerialDetails)
                .AsNoTracking() // Read-only query
                .FirstOrDefaultAsync(p => p.PickingOrderId == id);

            if (order == null)
                return NotFound("Picking order không tồn tại");

            var result = new PickingOrderResponse
            {
                PickingOrderId = order.PickingOrderId,
                OrderCode = order.OrderCode,
                CreateByUserId = order.CreateByUserId,
                CreateDate = order.CreateDate,
                Status = order.Status,
                // Lấy ngày xuất từ serial number đầu tiên (nếu có)
                PickedDate = order.PickingDetails
                    .SelectMany(d => d.PickingSerialDetails)
                    .Where(psd => psd.PickedDate != null)
                    .OrderBy(psd => psd.PickedDate)
                    .Select(psd => psd.PickedDate)
                    .FirstOrDefault(),
                PartnerId = order.PartnerId,
                PartnerName = order.Partner?.PartnerName ?? "",
                CreateByUser = new UserInfo
                {
                    UserId = order.CreateByUser.UserId,
                    UserName = order.CreateByUser.UserName ?? "",
                    FullName = order.CreateByUser.FullName ?? "",
                    Email = order.CreateByUser.Email ?? ""
                },
                Details = order.PickingDetails.Select(d => new PickingDetailResponse
                {
                    PickingDetailId = d.PickingDetailId,
                    ProductId = d.ProductId,
                    ProductCode = d.Product.ProductCode,
                    ProductName = d.Product.ProductName,
                    QuantityPicked = d.QuantityPicked,
                    UnitPrice = d.UnitPrice,
                    SerialNumbers = d.SerialNumbers,
                    SerialNumberDetails = d.PickingSerialDetails.Select(psd => new SerialNumberInfo
                    {
                        ProductSeriesId = psd.ProductSeriesId,
                        SerialNumber = psd.SerialNumber,
                        Status = psd.Status,
                        PickedDate = psd.PickedDate
                    }).ToList()
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreatePickingRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest("Request không hợp lệ");

                // Validate user exists
                var user = await _db.Users.FindAsync(request.CreateByUserId);
                if (user == null)
                    return BadRequest($"User ID {request.CreateByUserId} không tồn tại");

                // Validate partner exists
                var partner = await _db.Partners.FindAsync(request.PartnerId);
                if (partner == null)
                    return BadRequest($"Đối tác ID {request.PartnerId} không tồn tại. Vui lòng tạo đối tác trước.");

                // Generate order code - Chỉ lấy PickingOrderId để tránh lỗi NULL
                int? lastOrderId = await _db.PickingOrders
                    .OrderByDescending(o => o.PickingOrderId)
                    .Select(o => (int?)o.PickingOrderId)
                    .FirstOrDefaultAsync();

                int nextNumber = (lastOrderId ?? 0) + 1;
                string orderCode = $"PO{DateTime.Now:yyyyMMdd}{nextNumber:D4}";

                // Create new picking order
                var pickingOrder = new PickingOrder
                {
                    OrderCode = orderCode,
                    CreateByUserId = request.CreateByUserId,
                    PartnerId = request.PartnerId,
                    CreateDate = DateTime.Now,
                    Status = "Pending"
                };

                _db.PickingOrders.Add(pickingOrder);
                await _db.SaveChangesAsync();

                // Return as DTO - Sử dụng data đã có, không cần query lại
                var response = new PickingOrderResponse
                    {
                    PickingOrderId = pickingOrder.PickingOrderId,
                    OrderCode = pickingOrder.OrderCode,
                    CreateByUserId = pickingOrder.CreateByUserId,
                    CreateDate = pickingOrder.CreateDate,
                    Status = pickingOrder.Status,
                    PartnerId = pickingOrder.PartnerId,
                    PartnerName = partner.PartnerName ?? "",
                        CreateByUser = new UserInfo
                        {
                        UserId = user.UserId,
                        UserName = user.UserName ?? "",
                        FullName = user.FullName ?? "",
                        Email = user.Email ?? ""
                        },
                        Details = new List<PickingDetailResponse>()
                };

                return Ok(response);
            }
            catch (Microsoft.Data.SqlClient.SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "SQL Error in Create Picking Order: {Message}", sqlEx.Message);
                return StatusCode(500, $"Lỗi database: {sqlEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Create Picking Order: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}\nStack: {ex.StackTrace}");
            }
        }

        [HttpPost("add-item")]
        public async Task<IActionResult> AddItem([FromBody] AddPickingItemRequest request)
        {
            try
            {
                // Validate order
                var order = await _db.PickingOrders
                    .FirstOrDefaultAsync(p => p.PickingOrderId == request.PickingOrderId);
                if (order == null)
                    return NotFound("Picking order không tồn tại");
                if (order.Status == "Completed")
                    return BadRequest("Không thể thêm sản phẩm vào phiếu đã hoàn tất");

                // Validate product
                var product = await _db.Products
                    .FirstOrDefaultAsync(p => p.ProductId == request.ProductId);
                if (product == null)
                    return BadRequest("Sản phẩm không tồn tại");

                // Validate quantity
                if (request.QuantityPicked <= 0)
                    return BadRequest("Số lượng phải lớn hơn 0");

                // ✅ CHECK IF PRODUCT ALREADY EXISTS IN THIS ORDER
                var existingDetail = await _db.PickingDetails
                    .FirstOrDefaultAsync(d =>
                        d.PickingOrderId == request.PickingOrderId &&
                        d.ProductId == request.ProductId);

                if (existingDetail != null)
                {
                    // ✅ ĐÃ TỒN TẠI → CỘNG DỒN SỐ LƯỢNG
                    existingDetail.QuantityPicked += request.QuantityPicked;
                    await _db.SaveChangesAsync();

                    var updatedResult = new PickingDetailResponse
                    {
                        PickingDetailId = existingDetail.PickingDetailId,
                        ProductId = existingDetail.ProductId,
                        ProductCode = product.ProductCode,
                        ProductName = product.ProductName,
                        QuantityPicked = existingDetail.QuantityPicked,
                        UnitPrice = existingDetail.UnitPrice,
                        SerialNumbers = null, // Serial numbers sẽ được gán khi complete phiếu
                        SerialNumberDetails = new List<SerialNumberInfo>()
                    };

                    return Ok(updatedResult);
                }
                else
                {
                    // ✅ CHƯA CÓ → TẠO MỚI
                    var detail = new PickingDetail
                    {
                        PickingOrderId = request.PickingOrderId,
                        ProductId = request.ProductId,
                        QuantityPicked = request.QuantityPicked
                    };

                    _db.PickingDetails.Add(detail);
                    await _db.SaveChangesAsync();

                    var result = new PickingDetailResponse
                    {
                        PickingDetailId = detail.PickingDetailId,
                        ProductId = detail.ProductId,
                        ProductCode = product.ProductCode,
                        ProductName = product.ProductName,
                        QuantityPicked = detail.QuantityPicked,
                        UnitPrice = detail.UnitPrice,
                        SerialNumbers = null, // Serial numbers sẽ được gán khi complete phiếu
                        SerialNumberDetails = new List<SerialNumberInfo>()
                    };

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        [HttpPost("complete/{id}")]
        public async Task<IActionResult> Complete(int id)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var p = await _db.PickingOrders
                    .Include(x => x.PickingDetails)
                        .ThenInclude(d => d.Product)
                    .FirstOrDefaultAsync(x => x.PickingOrderId == id);

                if (p == null)
                    return NotFound("Picking order không tồn tại");

                if (p.Status == "Completed")
                    return BadRequest("Phiếu xuất đã được hoàn tất");

                if (!p.PickingDetails.Any())
                    return BadRequest("Phiếu xuất chưa có sản phẩm nào");

                // ✅ NEW FIFO LOGIC: Deduct from oldest lots first
                // ✅ TÍNH GIÁ THEO TỶ LỆ khi giao một phần lô hàng
                // ✅ CẬP NHẬT SERIAL NUMBERS khi xuất hàng
                foreach (var d in p.PickingDetails)
                {
                    // Check total available inventory
                    var totalAvailable = await _db.InventoryDetails
                        .Where(id => id.ProductId == d.ProductId && id.QuantityRemaining > 0)
                        .SumAsync(id => (int?)id.QuantityRemaining) ?? 0;

                    if (totalAvailable < d.QuantityPicked)
                        return BadRequest($"Không đủ tồn kho cho {d.Product?.ProductName}! Tồn kho: {totalAvailable}, Yêu cầu: {d.QuantityPicked}");

                    // Get lots ordered by ReceivedDate (FIFO - oldest first)
                    // KHÔNG Include ProductSeries để tránh tracking issues, sẽ query riêng sau
                    var lots = await _db.InventoryDetails
                        .Where(id => id.ProductId == d.ProductId && id.QuantityRemaining > 0)
                        .OrderBy(id => id.ReceivedDate)
                        .ThenBy(id => id.InventoryDetailId) // Secondary sort for deterministic ordering
                        .ToListAsync();

                    int qtyToPick = d.QuantityPicked;
                    int balanceAfter = totalAvailable;
                    decimal totalPrice = 0; // Tổng giá trị hàng xuất
                    
                    // ✅ CHỈ CẬP NHẬT SERIAL NUMBERS CHO SẢN PHẨM CÓ SERIAL NUMBER (theo FIFO)
                    // Kiểm tra xem sản phẩm có sử dụng serial numbers không
                    var totalSerialCount = await _db.ProductSeries
                        .Where(ps => ps.ProductId == d.ProductId)
                        .CountAsync();
                    
                    List<ProductSeries> serialNumbersToPick = new List<ProductSeries>();
                    
                    // Chỉ xử lý serial numbers nếu sản phẩm có serial numbers trong hệ thống
                    if (totalSerialCount > 0)
                    {
                        // Lấy serial numbers InStock, chưa có PickedDate, chưa được gán cho picking detail nào, sắp xếp theo FIFO
                        serialNumbersToPick = await _db.ProductSeries
                            .Where(ps => ps.ProductId == d.ProductId 
                                && ps.Status == "InStock" 
                                && ps.PickedDate == null
                                && ps.PickingDetailId == null) // Chưa được gán cho picking detail nào
                            .OrderBy(ps => ps.ReceivedDate ?? DateTime.MinValue) // FIFO: nhập trước xuất trước
                            .ThenBy(ps => ps.ProductSeriesId)
                            .Take(d.QuantityPicked)
                        .ToListAsync();
                    
                    _logger.LogInformation(
                            "Found {Count} serial numbers available for ProductId {ProductId}, QuantityPicked: {QuantityPicked}",
                            serialNumbersToPick.Count, d.ProductId, d.QuantityPicked);
                    
                        // Chỉ kiểm tra đủ serial numbers nếu sản phẩm có serial numbers
                        if (serialNumbersToPick.Count < d.QuantityPicked)
                    {
                            return BadRequest($"Không đủ serial numbers trong kho cho {d.Product?.ProductName}! Có {serialNumbersToPick.Count} serial numbers có sẵn, nhưng yêu cầu {d.QuantityPicked}.");
                    }
                    
                    if (serialNumbersToPick.Any())
                    {
                        _logger.LogInformation(
                                "✅ Selected {Count} serial numbers by FIFO for picking",
                            serialNumbersToPick.Count);
                        foreach (var serial in serialNumbersToPick)
                        {
                            _logger.LogInformation(
                                    "  - Serial: {SerialNumber} (ID: {ProductSeriesId}, ReceivedDate: {ReceivedDate})",
                                    serial.SerialNumber, serial.ProductSeriesId, serial.ReceivedDate?.ToString("yyyy-MM-dd") ?? "N/A");
                            }
                        }
                    }
                    else
                    {
                        _logger.LogInformation(
                            "ProductId {ProductId} ({ProductName}) không sử dụng serial numbers, bỏ qua cập nhật serial numbers",
                            d.ProductId, d.Product?.ProductName);
                    }

                    // Deduct from lots using FIFO và tính giá theo tỷ lệ
                    foreach (var lot in lots)
                    {
                        if (qtyToPick <= 0) break;

                        int deduct = Math.Min(lot.QuantityRemaining, qtyToPick);
                        
                        // ✅ TÍNH GIÁ THEO TỶ LỆ: Nếu lô 100 cái = 2,000,000, giao 50 cái = 1,000,000
                        // Giá đơn vị của lô = lot.Price / lot.QuantityIn
                        // Giá của số lượng giao = (lot.Price / lot.QuantityIn) * deduct
                        decimal unitPriceFromLot = lot.QuantityIn > 0 ? lot.Price / lot.QuantityIn : 0;
                        decimal priceForDeductedQty = unitPriceFromLot * deduct;
                        totalPrice += priceForDeductedQty;

                        lot.QuantityRemaining -= deduct;
                        qtyToPick -= deduct;
                        balanceAfter -= deduct;

                        // Create InventoryLog for each deduction
                        var inventoryLog = new InventoryLog
                        {
                            ProductId = d.ProductId,
                            InventoryDetailId = lot.InventoryDetailId,
                            TransactionDate = DateTime.Now,
                            TransactionType = "OUT",
                            QuantityChange = -deduct,
                            BalanceAfter = balanceAfter,
                            ReferenceId = p.PickingOrderId,
                            ReferenceType = "PICKING",
                            UserId = p.CreateByUserId
                        };
                        _db.InventoryLogs.Add(inventoryLog);
                    }

                    // ✅ CẬP NHẬT SERIAL NUMBERS: Đánh dấu đã xuất
                    _logger.LogInformation(
                        "=== SERIAL NUMBER UPDATE CHECK ===");
                    _logger.LogInformation(
                        "ProductId: {ProductId}, QuantityPicked: {QuantityPicked}, SerialNumbersToPick Count: {Count}",
                        d.ProductId, d.QuantityPicked, serialNumbersToPick.Count);

                    if (serialNumbersToPick.Any())
                    {
                        try
                        {
                            var serialIdsToUpdate = serialNumbersToPick.Select(s => s.ProductSeriesId).ToList();
                            
                            _logger.LogInformation(
                                "Preparing to update {Count} serial numbers for ProductId {ProductId}, PickingDetailId {PickingDetailId}. Serial IDs: {SerialIds}",
                                serialIdsToUpdate.Count, d.ProductId, d.PickingDetailId, string.Join(", ", serialIdsToUpdate));

                            // ✅ CẬP NHẬT SERIAL NUMBERS: Sử dụng cả EF và SQL để đảm bảo hoạt động
                            var pickedDate = DateTime.Now;
                            
                            // Bước 1: Reload serial numbers từ database để đảm bảo tracking đúng
                            var serialsToUpdate = await _db.ProductSeries
                                .Where(ps => serialIdsToUpdate.Contains(ps.ProductSeriesId) && ps.Status == "InStock")
                                .ToListAsync();
                            
                            _logger.LogInformation(
                                "Reloaded {Count} serial numbers from database for update (expected {Expected})",
                                serialsToUpdate.Count, serialIdsToUpdate.Count);
                            
                            if (serialsToUpdate.Count == 0)
                            {
                                _logger.LogWarning(
                                    "⚠️ CRITICAL: No serial numbers found to update! SerialIds: {SerialIds}",
                                    string.Join(", ", serialIdsToUpdate));
                            }
                            
                            int updatedCount = 0;
                            foreach (var serial in serialsToUpdate)
                            {
                                var oldStatus = serial.Status;
                                var oldPickedDate = serial.PickedDate;
                                
                                serial.Status = "Picked";
                                serial.PickingDetailId = d.PickingDetailId;
                                serial.PickedDate = pickedDate; // ✅ Cập nhật PickedDate
                                
                                // Đánh dấu entity là Modified để đảm bảo EF lưu tất cả thay đổi
                                _db.Entry(serial).State = Microsoft.EntityFrameworkCore.EntityState.Modified;
                                
                                updatedCount++;
                                _logger.LogInformation(
                                    "✅ Marked serial {SerialNumber} (ID: {ProductSeriesId}) for update: Status {OldStatus} -> Picked, PickedDate {OldPickedDate} -> {NewPickedDate}",
                                    serial.SerialNumber, serial.ProductSeriesId, oldStatus, oldPickedDate?.ToString("yyyy-MM-dd HH:mm:ss") ?? "null", pickedDate.ToString("yyyy-MM-dd HH:mm:ss"));
                            }
                            
                            // Bước 2: Cập nhật bằng SQL trực tiếp để đảm bảo chắc chắn (trong cùng transaction)
                            if (serialsToUpdate.Any())
                            {
                                // Cập nhật từng serial number bằng ExecuteSqlInterpolatedAsync để đảm bảo an toàn
                                int sqlUpdatedCount = 0;
                                foreach (var serial in serialsToUpdate)
                                {
                                    try
                                    {
                                        var sqlRowsAffected = await _db.Database.ExecuteSqlInterpolatedAsync(
                                            $"UPDATE ProductSeries SET Status = 'Picked', PickingDetailId = {d.PickingDetailId}, PickedDate = {pickedDate} WHERE ProductSeriesId = {serial.ProductSeriesId} AND Status = 'InStock'");
                                        
                                        if (sqlRowsAffected > 0)
                                        {
                                            sqlUpdatedCount++;
                                            _logger.LogInformation(
                                                "✅ SQL Update successful for serial ID {SerialId}",
                                                serial.ProductSeriesId);
                                        }
                                        else
                                        {
                                            _logger.LogWarning(
                                                "⚠️ SQL Update returned 0 rows for serial ID {SerialId}",
                                                serial.ProductSeriesId);
                                        }
                                    }
                                    catch (Exception sqlEx)
                                    {
                                        _logger.LogError(sqlEx,
                                            "❌ Error executing SQL update for serial ID {SerialId}: {Message}",
                                            serial.ProductSeriesId, sqlEx.Message);
                                        // Không throw để tiếp tục với các serial khác
                                    }
                                }
                                
                                _logger.LogInformation(
                                    "✅ SQL Update completed: {UpdatedCount} out of {Total} serial numbers updated",
                                    sqlUpdatedCount, serialsToUpdate.Count);
                            }
                            
                            _logger.LogInformation(
                                "✅ Prepared {UpdatedCount} out of {TotalSerials} serial numbers for update (EF + SQL) for ProductId {ProductId}, PickingDetailId {PickingDetailId}",
                                updatedCount, serialIdsToUpdate.Count, d.ProductId, d.PickingDetailId);

                            // ✅ TẠO PickingSerialDetail records để lưu thông tin serial numbers đã xuất
                            foreach (var serial in serialNumbersToPick)
                            {
                                try
                                {
                                        var pickingSerialDetail = new PickingSerialDetail
                                        {
                                            PickingDetailId = d.PickingDetailId,
                                            ProductSeriesId = serial.ProductSeriesId,
                                            ProductId = d.ProductId,
                                            SerialNumber = serial.SerialNumber,
                                            PickedDate = pickedDate,
                                            Status = "Picked"
                                        };
                                        _db.PickingSerialDetails.Add(pickingSerialDetail);
                                        _logger.LogInformation(
                                        "✅ Created PickingSerialDetail for serial {SerialNumber} (ID: {SerialId})",
                                        serial.SerialNumber, serial.ProductSeriesId);
                                    }
                                    catch (Exception addEx)
                                    {
                                        _logger.LogError(addEx,
                                            "Error adding PickingSerialDetail for serial {SerialId}: {Message}",
                                            serial.ProductSeriesId, addEx.Message);
                                }
                            }
                        }
                        catch (Exception serialUpdateEx)
                        {
                            _logger.LogError(serialUpdateEx,
                                "❌ CRITICAL ERROR updating serial numbers for ProductId {ProductId}, PickingDetailId {PickingDetailId}: {Message}\nStackTrace: {StackTrace}",
                                d.ProductId, d.PickingDetailId, serialUpdateEx.Message, serialUpdateEx.StackTrace);
                            throw; // Re-throw để transaction rollback
                        }
                    }
                    else
                    {
                        // Nếu không có serial numbers, có thể sản phẩm không dùng serial numbers
                        _logger.LogInformation(
                            "No serial numbers to update for ProductId {ProductId}, QuantityPicked {QuantityPicked}. " +
                            "This might be normal if the product doesn't use serial numbers.",
                            d.ProductId, d.QuantityPicked);
                    }

                    // ✅ LƯU GIÁ VÀO PICKING DETAIL
                    // Giá đơn vị trung bình = tổng giá / số lượng
                    if (d.QuantityPicked > 0)
                    {
                        d.UnitPrice = totalPrice / d.QuantityPicked;
                    }
                }

                p.Status = "Completed";
                
                // ✅ LƯU TẤT CẢ THAY ĐỔI VÀO DATABASE
                try
                {
                    // Kiểm tra xem có bao nhiêu serial numbers đã được đánh dấu để cập nhật
                    var totalSerialsToUpdate = p.PickingDetails
                        .SelectMany(d => _db.ProductSeries
                            .Where(ps => ps.PickingDetailId == d.PickingDetailId && ps.Status == "Picked")
                            .Select(ps => ps.ProductSeriesId))
                        .Count();
                    
                    _logger.LogInformation(
                        "Before SaveChanges: Found {Count} serial numbers marked for update in PickingOrder {PickingOrderId}",
                        totalSerialsToUpdate, id);

                    var changeCount = await _db.SaveChangesAsync();
                    _logger.LogInformation(
                        "Successfully saved {ChangeCount} changes for PickingOrder {PickingOrderId}", 
                        changeCount, id);
                    
                    // Verify sau khi save
                    var verifiedSerials = await _db.ProductSeries
                        .Where(ps => p.PickingDetails.Select(d => d.PickingDetailId).Contains(ps.PickingDetailId ?? 0)
                                  && ps.Status == "Picked")
                        .CountAsync();
                    
                    _logger.LogInformation(
                        "After SaveChanges: Verified {Count} serial numbers with Status='Picked' for PickingOrder {PickingOrderId}",
                        verifiedSerials, id);
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(saveEx, 
                        "Error saving changes for PickingOrder {PickingOrderId}: {Message}\nStackTrace: {StackTrace}", 
                        id, saveEx.Message, saveEx.StackTrace);
                    await transaction.RollbackAsync();
                    return StatusCode(500, $"Lỗi khi lưu dữ liệu: {saveEx.Message}");
                }

                await transaction.CommitAsync();
                _logger.LogInformation("Successfully completed PickingOrder {PickingOrderId}", id);

                return Ok(new { Message = "Hoàn tất phiếu xuất thành công" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error completing PickingOrder {PickingOrderId}: {Message}\nStackTrace: {StackTrace}", 
                    id, ex.Message, ex.StackTrace);
                
                if (ex.InnerException != null)
                {
                    _logger.LogError("Inner Exception: {Message}", ex.InnerException.Message);
                }
                
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        [HttpPut("update-detail/{id}")]
        public async Task<IActionResult> UpdateDetail(int id, [FromBody] UpdatePickingDetailRequest request)
        {
            try
            {
                var detail = await _db.PickingDetails
                    .Include(d => d.PickingOrder)
                    .Include(d => d.Product)
                    .FirstOrDefaultAsync(d => d.PickingDetailId == id);

                if (detail == null)
                    return NotFound("Chi tiết không tồn tại");

                if (detail.PickingOrder?.Status == "Completed")
                    return BadRequest("Không thể chỉnh sửa sản phẩm từ phiếu đã hoàn tất");

                // Cập nhật số lượng và số series
                detail.QuantityPicked = request.QuantityPicked;
                if (request.SerialNumbers != null)
                    detail.SerialNumbers = request.SerialNumbers;

                if (request.QuantityPicked <= 0)
                    return BadRequest("Số lượng phải lớn hơn 0");

                detail.QuantityPicked = request.QuantityPicked;
                await _db.SaveChangesAsync();

                var result = new PickingDetailResponse
                {
                    PickingDetailId = detail.PickingDetailId,
                    ProductId = detail.ProductId,
                    ProductCode = detail.Product.ProductCode,
                    ProductName = detail.Product.ProductName,
                    QuantityPicked = detail.QuantityPicked
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating picking detail: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        [HttpDelete("detail/{id}")]
        public async Task<IActionResult> DeleteDetail(int id)
        {
            try
            {
                var detail = await _db.PickingDetails
                    .Include(d => d.PickingOrder)
                    .FirstOrDefaultAsync(d => d.PickingDetailId == id);

                if (detail == null)
                    return NotFound("Chi tiết không tồn tại");

                if (detail.PickingOrder?.Status == "Completed")
                    return BadRequest("Không thể xóa sản phẩm từ phiếu đã hoàn tất");

                _db.PickingDetails.Remove(detail);
                await _db.SaveChangesAsync();

                return Ok("Đã xóa sản phẩm");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting picking detail: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // ✅ HỦY PHIẾU XUẤT ĐANG PENDING
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                var pickingOrder = await _db.PickingOrders
                    .FirstOrDefaultAsync(p => p.PickingOrderId == id);

                if (pickingOrder == null)
                    return NotFound("Không tìm thấy phiếu xuất.");

                // Chỉ cho phép hủy khi phiếu đang ở trạng thái Pending
                if (pickingOrder.Status != "Pending")
                    return BadRequest("Chỉ có thể hủy phiếu xuất đang ở trạng thái Pending.");

                // Cập nhật trạng thái thành Cancelled
                pickingOrder.Status = "Cancelled";

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Hủy phiếu xuất thành công.",
                    pickingOrderId = pickingOrder.PickingOrderId,
                    orderCode = pickingOrder.OrderCode,
                    status = pickingOrder.Status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling picking order: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }
    }
}
