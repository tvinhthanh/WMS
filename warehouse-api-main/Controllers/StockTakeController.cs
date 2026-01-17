using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.DTO;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockTakeController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private readonly ILogger<StockTakeController> _logger;
        private const int DAMAGE_RETURN_THRESHOLD = 20; // Ngưỡng tự tạo phiếu xuất trả

        public StockTakeController(WmsDbContext db, ILogger<StockTakeController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private async Task<string> GenerateReturnPickingCode()
        {
            int count = await _db.PickingOrders.CountAsync(po => po.OrderCode.StartsWith("RTN-")) + 1;
            return $"RTN-{count:D3}";
        }

        private async Task AddPendingDamageAsync(int productId, int partnerId, int? receivingDetailId, int quantity, string? reason, string sourceType, int? sourceId, DateTime damageDate, DateTime? receivedDate)
        {
            var pending = new PendingDamage
            {
                ProductId = productId,
                PartnerId = partnerId,
                ReceivingDetailId = receivingDetailId,
                Quantity = quantity,
                DamageReason = reason,
                DamageDate = damageDate,
                ReceivedDate = receivedDate,
                SourceType = sourceType,
                SourceId = sourceId,
                Status = "Pending",
                CreatedDate = DateTime.Now
            };
            _db.PendingDamages.Add(pending);
            await _db.SaveChangesAsync();
        }

        private async Task CheckAndAutoCreateReturnOrdersAsync(int createByUserId)
        {
            var groups = await _db.PendingDamages
                .Where(p => p.Status == "Pending")
                .GroupBy(p => new { p.PartnerId, p.ProductId })
                .Select(g => new
                {
                    g.Key.PartnerId,
                    g.Key.ProductId,
                    Total = g.Sum(x => x.Quantity)
                })
                .Where(x => x.Total >= DAMAGE_RETURN_THRESHOLD)
                .ToListAsync();

            if (!groups.Any()) return;

            var byPartner = groups.GroupBy(g => g.PartnerId);
            foreach (var partnerGroup in byPartner)
            {
                var partnerId = partnerGroup.Key;

                var pickingOrder = new PickingOrder
                {
                    OrderCode = await GenerateReturnPickingCode(),
                    CreateByUserId = createByUserId,
                    PartnerId = partnerId,
                    CreateDate = DateTime.Now,
                    Status = "Pending"
                };
                _db.PickingOrders.Add(pickingOrder);
                await _db.SaveChangesAsync();

                var productIds = partnerGroup.Select(pg => pg.ProductId).ToList();

                foreach (var item in partnerGroup)
                {
                    _db.PickingDetails.Add(new PickingDetail
                    {
                        PickingOrderId = pickingOrder.PickingOrderId,
                        ProductId = item.ProductId,
                        QuantityPicked = item.Total
                    });
                }
                await _db.SaveChangesAsync();

                var pendingToMark = await _db.PendingDamages
                    .Where(p => p.Status == "Pending"
                                && p.PartnerId == partnerId
                                && productIds.Contains(p.ProductId))
                    .ToListAsync();

                foreach (var pd in pendingToMark)
                {
                    pd.Status = "Queued";
                    pd.PickingOrderId = pickingOrder.PickingOrderId;
                }
                await _db.SaveChangesAsync();
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var stockTakes = await _db.StockTakes
                .Include(st => st.CreatedByUser)
                .Include(st => st.StockTakeDetails)
                    .ThenInclude(d => d.Product)
                .OrderByDescending(st => st.CreatedDate)
                .ToListAsync();

            var productIds = stockTakes.SelectMany(st => st.StockTakeDetails.Select(d => d.ProductId)).Distinct().ToList();
            var inventoryDetails = await _db.InventoryDetails
                .Include(id => id.ProductSeries)
                .Where(id => productIds.Contains(id.ProductId) && id.QuantityRemaining > 0)
                .ToListAsync();

            var serialNumbersByProduct = inventoryDetails
                .SelectMany(id => id.ProductSeries.Where(ps => ps.Status == "InStock"))
                .GroupBy(ps => ps.ProductId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(ps => new SerialNumberInfo
                    {
                        ProductSeriesId = ps.ProductSeriesId,
                        SerialNumber = ps.SerialNumber,
                        Status = ps.Status
                    }).OrderBy(s => s.SerialNumber).ToList()
                );

            var result = stockTakes.Select(st => new StockTakeDTO
            {
                StockTakeId = st.StockTakeId,
                StockTakeCode = st.StockTakeCode,
                StockTakeDate = st.StockTakeDate,
                CreatedByUserId = st.CreatedByUserId,
                CreatedByUserName = st.CreatedByUser?.FullName ?? "",
                CreatedDate = st.CreatedDate,
                Status = st.Status,
                Note = st.Note,
                Details = st.StockTakeDetails.Select(d => new StockTakeDetailDTO
                {
                    StockTakeDetailId = d.StockTakeDetailId,
                    ProductId = d.ProductId,
                    ProductName = d.Product.ProductName,
                    ProductCode = d.Product.ProductCode,
                    SystemQuantity = d.SystemQuantity,
                    ActualQuantity = d.ActualQuantity,
                    DamageQuantity = d.DamageQuantity,
                    DamageReason = d.DamageReason,
                    Variance = d.Variance,
                    Note = d.Note,
                    SerialNumbers = serialNumbersByProduct.ContainsKey(d.ProductId) 
                        ? serialNumbersByProduct[d.ProductId] 
                        : new List<SerialNumberInfo>()
                }).ToList()
            }).ToList();

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var stockTake = await _db.StockTakes
                .Include(st => st.CreatedByUser)
                .Include(st => st.StockTakeDetails)
                    .ThenInclude(d => d.Product)
                .FirstOrDefaultAsync(st => st.StockTakeId == id);

            if (stockTake == null)
                return NotFound("Phiếu kiểm kê không tồn tại");

            var productIds = stockTake.StockTakeDetails.Select(d => d.ProductId).ToList();
            var inventoryDetails = await _db.InventoryDetails
                .Include(id => id.ProductSeries)
                .Where(id => productIds.Contains(id.ProductId) && id.QuantityRemaining > 0)
                .ToListAsync();

            var serialNumbersByProduct = inventoryDetails
                .SelectMany(id => id.ProductSeries.Where(ps => ps.Status == "InStock"))
                .GroupBy(ps => ps.ProductId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(ps => new SerialNumberInfo
                    {
                        ProductSeriesId = ps.ProductSeriesId,
                        SerialNumber = ps.SerialNumber,
                        Status = ps.Status
                    }).OrderBy(s => s.SerialNumber).ToList()
                );

            var result = new StockTakeDTO
            {
                StockTakeId = stockTake.StockTakeId,
                StockTakeCode = stockTake.StockTakeCode,
                StockTakeDate = stockTake.StockTakeDate,
                CreatedByUserId = stockTake.CreatedByUserId,
                CreatedByUserName = stockTake.CreatedByUser?.FullName ?? "",
                CreatedDate = stockTake.CreatedDate,
                Status = stockTake.Status,
                Note = stockTake.Note,
                Details = stockTake.StockTakeDetails.Select(d => new StockTakeDetailDTO
                {
                    StockTakeDetailId = d.StockTakeDetailId,
                    ProductId = d.ProductId,
                    ProductName = d.Product.ProductName,
                    ProductCode = d.Product.ProductCode,
                    SystemQuantity = d.SystemQuantity,
                    ActualQuantity = d.ActualQuantity,
                    DamageQuantity = d.DamageQuantity,
                    DamageReason = d.DamageReason,
                    Variance = d.Variance,
                    Note = d.Note,
                    SerialNumbers = serialNumbersByProduct.ContainsKey(d.ProductId) 
                        ? serialNumbersByProduct[d.ProductId] 
                        : new List<SerialNumberInfo>()
                }).ToList()
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StockTakeCreateDTO dto)
        {
            try
            {
                if (dto.Details == null || dto.Details.Count == 0)
                    return BadRequest("Phiếu kiểm kê phải có ít nhất 1 sản phẩm");

                // Validate user
                var user = await _db.Users.FindAsync(dto.CreatedByUserId);
                if (user == null)
                    return BadRequest("User không tồn tại");

                // Generate stock take code
                int? lastStockTake = await _db.StockTakes
                    .OrderByDescending(st => st.StockTakeId)
                    .Select(st => st.StockTakeId)
                    .FirstOrDefaultAsync();

                int nextNumber = (lastStockTake ?? 0) + 1;
                string stockTakeCode = $"KK{DateTime.Now:yyyyMMdd}{nextNumber:D4}";

                // ✅ NHÂN VIÊN CHỈ NHẬP ActualQuantity + DamageQuantity
                // KHÔNG tính SystemQuantity và Variance khi Create (admin sẽ tính khi duyệt)

                // Create StockTake
                var stockTake = new StockTake
                {
                    StockTakeCode = stockTakeCode,
                    StockTakeDate = dto.StockTakeDate,
                    CreatedByUserId = dto.CreatedByUserId,
                    CreatedDate = DateTime.Now,
                    Status = "Pending", // Nhân viên tạo, chưa gửi
                    Note = dto.Note
                };

                _db.StockTakes.Add(stockTake);
                await _db.SaveChangesAsync();

                // Create StockTakeDetails - KHÔNG tính SystemQuantity và Variance
                foreach (var detailDto in dto.Details)
                {
                    var product = await _db.Products.FindAsync(detailDto.ProductId);
                    if (product == null)
                        continue;

                    var detail = new StockTakeDetail
                    {
                        StockTakeId = stockTake.StockTakeId,
                        ProductId = detailDto.ProductId,
                        SystemQuantity = 0, // Sẽ tính khi admin duyệt
                        ActualQuantity = detailDto.ActualQuantity,
                        DamageQuantity = detailDto.DamageQuantity,
                        DamageReason = detailDto.DamageReason,
                        Variance = 0, // Sẽ tính khi admin duyệt
                        Note = detailDto.Note
                    };

                    _db.StockTakeDetails.Add(detail);
                }

                await _db.SaveChangesAsync();

                return Ok(new { message = "Tạo phiếu kiểm kê thành công", stockTakeId = stockTake.StockTakeId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating stock take: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // ✅ NHÂN VIÊN GỬI BÁO CÁO (Status: Pending -> Submitted)
        [HttpPost("submit/{id}")]
        public async Task<IActionResult> Submit(int id)
        {
            try
            {
                var stockTake = await _db.StockTakes.FindAsync(id);
                if (stockTake == null)
                    return NotFound("Phiếu kiểm kê không tồn tại");

                if (stockTake.Status != "Pending")
                    return BadRequest("Chỉ có thể gửi phiếu kiểm kê ở trạng thái Pending");

                stockTake.Status = "Submitted";
                await _db.SaveChangesAsync();

                return Ok(new { message = "Đã gửi báo cáo kiểm kê cho admin duyệt" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting stock take: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // ✅ ADMIN DUYỆT BÁO CÁO (Status: Submitted -> Completed)
        // Tính SystemQuantity, so sánh, điều chỉnh tồn kho, tự tạo phiếu xuất trả nếu hàng hư nhiều
        [HttpPost("review/{id}")]
        public async Task<IActionResult> Review(int id, [FromBody] StockTakeReviewDTO? reviewDto = null)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var stockTake = await _db.StockTakes
                    .Include(st => st.StockTakeDetails)
                        .ThenInclude(d => d.Product)
                    .FirstOrDefaultAsync(st => st.StockTakeId == id);

                if (stockTake == null)
                    return NotFound("Phiếu kiểm kê không tồn tại");

                if (stockTake.Status != "Submitted")
                    return BadRequest("Chỉ có thể duyệt phiếu kiểm kê ở trạng thái Submitted");

                if (!stockTake.StockTakeDetails.Any())
                    return BadRequest("Phiếu kiểm kê chưa có sản phẩm nào");

                // ✅ BƯỚC 1: TÍNH SystemQuantity VÀ Variance (Admin mới tính)
                var productIds = stockTake.StockTakeDetails.Select(d => d.ProductId).ToList();
                var inventoryDetails = await _db.InventoryDetails
                    .Where(id => productIds.Contains(id.ProductId) && id.QuantityRemaining > 0)
                    .ToListAsync();
                
                var systemInventories = inventoryDetails
                    .GroupBy(id => id.ProductId)
                    .ToDictionary(g => g.Key, g => g.Sum(id => id.QuantityRemaining));

                // Cập nhật SystemQuantity và Variance cho từng detail
                foreach (var detail in stockTake.StockTakeDetails)
                {
                    int systemQty = systemInventories.GetValueOrDefault(detail.ProductId, 0);
                    detail.SystemQuantity = systemQty;
                    detail.Variance = detail.ActualQuantity - systemQty; // Variance = Actual - System
                }

                // ✅ BƯỚC 2: ĐIỀU CHỈNH TỒN KHO (giống logic Complete cũ)
                foreach (var detail in stockTake.StockTakeDetails)
                {
                    var currentBalance = await _db.InventoryDetails
                        .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                        .SumAsync(id => (int?)id.QuantityRemaining) ?? 0;

                    if (detail.Variance == 0 && detail.DamageQuantity == 0)
                        continue;

                    int runningBalance = currentBalance;

                    // Xử lý hàng hư hỏng TRƯỚC
                    if (detail.DamageQuantity > 0)
                    {
                        int qtyToDeduct = detail.DamageQuantity;
                        var lots = await _db.InventoryDetails
                            .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                            .OrderBy(id => id.ReceivedDate)
                            .ThenBy(id => id.InventoryDetailId)
                            .ToListAsync();

                        foreach (var lot in lots)
                        {
                            if (qtyToDeduct <= 0) break;
                            int deduct = Math.Min(lot.QuantityRemaining, qtyToDeduct);
                            lot.QuantityRemaining -= deduct;
                            qtyToDeduct -= deduct;
                        }
                        
                        runningBalance -= detail.DamageQuantity;
                        
                        var damageLog = new InventoryLog
                        {
                            ProductId = detail.ProductId,
                            InventoryDetailId = null,
                            TransactionDate = DateTime.Now,
                            TransactionType = "DAMAGE",
                            QuantityChange = -detail.DamageQuantity,
                            BalanceAfter = runningBalance,
                            ReferenceId = stockTake.StockTakeId,
                            ReferenceType = "STOCKTAKE",
                            UserId = stockTake.CreatedByUserId
                        };
                        _db.InventoryLogs.Add(damageLog);

                        // Lưu pending damage để gom ngưỡng
                        var latestReceiving = await _db.ReceivingDetails
                            .Include(rd => rd.Receiving)
                            .Where(rd => rd.ProductId == detail.ProductId)
                            .OrderByDescending(rd => rd.Receiving.ReceivedDate)
                            .Select(rd => new
                            {
                                rd.ReceivingDetailId,
                                rd.Receiving.PartnerId,
                                rd.Receiving.ReceivedDate
                            })
                            .FirstOrDefaultAsync();

                        if (latestReceiving != null && latestReceiving.PartnerId > 0)
                        {
                            await AddPendingDamageAsync(
                                detail.ProductId,
                                latestReceiving.PartnerId,
                                latestReceiving.ReceivingDetailId,
                                detail.DamageQuantity,
                                detail.DamageReason,
                                "STOCKTAKE",
                                stockTake.StockTakeId,
                                DateTime.Now,
                                latestReceiving.ReceivedDate);
                        }
                    }

                    // Xử lý variance
                    if (detail.Variance != 0)
                    {
                        runningBalance += detail.Variance;
                        
                        var varianceLog = new InventoryLog
                        {
                            ProductId = detail.ProductId,
                            InventoryDetailId = null,
                            TransactionDate = DateTime.Now,
                            TransactionType = "ADJUST",
                            QuantityChange = detail.Variance,
                            BalanceAfter = runningBalance,
                            ReferenceId = stockTake.StockTakeId,
                            ReferenceType = "STOCKTAKE",
                            UserId = stockTake.CreatedByUserId
                        };
                        _db.InventoryLogs.Add(varianceLog);
                        
                        if (detail.Variance > 0)
                        {
                            var oldestLot = await _db.InventoryDetails
                                .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                                .OrderBy(id => id.ReceivedDate)
                                .FirstOrDefaultAsync();

                            if (oldestLot != null)
                            {
                                oldestLot.QuantityRemaining += detail.Variance;
                            }
                            else
                            {
                                var newLot = new InventoryDetail
                                {
                                    ProductId = detail.ProductId,
                                    ReceivingDetailId = null,
                                    QuantityIn = detail.Variance,
                                    QuantityRemaining = detail.Variance,
                                    Unit = detail.Product.Unit ?? "pcs",
                                    Price = 0,
                                    ReceivedDate = DateTime.Now
                                };
                                _db.InventoryDetails.Add(newLot);
                            }
                        }
                        else if (detail.Variance < 0)
                        {
                            int qtyToDeduct = Math.Abs(detail.Variance);
                            var lots = await _db.InventoryDetails
                                .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                                .OrderBy(id => id.ReceivedDate)
                                .ThenBy(id => id.InventoryDetailId)
                                .ToListAsync();

                            foreach (var lot in lots)
                            {
                                if (qtyToDeduct <= 0) break;
                                int deduct = Math.Min(lot.QuantityRemaining, qtyToDeduct);
                                lot.QuantityRemaining -= deduct;
                                qtyToDeduct -= deduct;
                            }
                        }
                    }
                }

                stockTake.Status = "Completed";
                await _db.SaveChangesAsync();
                await CheckAndAutoCreateReturnOrdersAsync(stockTake.CreatedByUserId);
                await transaction.CommitAsync();

                var response = new { 
                    message = "Đã duyệt và hoàn tất kiểm kê. Tồn kho đã được điều chỉnh.",
                    returnPickingOrderId = (int?)null
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error reviewing stock take: {Message}", ex.Message);
                
                string errorMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    errorMessage += $" | Chi tiết: {ex.InnerException.Message}";
                }
                
                return StatusCode(500, $"Lỗi: {errorMessage}");
            }
        }

        // ✅ GIỮ LẠI Complete ĐỂ TƯƠNG THÍCH (nếu có code cũ dùng)
        [HttpPost("complete/{id}")]
        [Obsolete("Sử dụng Review thay vì Complete")]
        public async Task<IActionResult> Complete(int id)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var stockTake = await _db.StockTakes
                    .Include(st => st.StockTakeDetails)
                        .ThenInclude(d => d.Product)
                    .FirstOrDefaultAsync(st => st.StockTakeId == id);

                if (stockTake == null)
                    return NotFound("Phiếu kiểm kê không tồn tại");

                if (stockTake.Status == "Completed")
                    return BadRequest("Phiếu kiểm kê đã được hoàn tất");

                if (!stockTake.StockTakeDetails.Any())
                    return BadRequest("Phiếu kiểm kê chưa có sản phẩm nào");

                // Validate: Kiểm tra các trường hợp đặc biệt
                foreach (var detail in stockTake.StockTakeDetails)
                {
                    // Nếu tồn hệ thống = 0 và thực tế > 0 → Cảnh báo (có thể là hàng thừa hoặc nhập chưa cập nhật)
                    if (detail.SystemQuantity == 0 && detail.ActualQuantity > 0)
                    {
                        // Cho phép nhưng có thể log cảnh báo
                        // Không báo lỗi vì có thể hợp lý (hàng thừa, nhập chưa cập nhật)
                    }

                    // Nếu tồn hệ thống = 0 và thực tế = 0 → Không cần điều chỉnh (OK)
                    // Nếu tồn hệ thống > 0 và thực tế < 0 → Không hợp lý (ActualQuantity không thể < 0)
                    if (detail.ActualQuantity < 0)
                    {
                        return BadRequest($"Số lượng thực tế không thể âm cho sản phẩm {detail.Product?.ProductName ?? detail.ProductId.ToString()}");
                    }

                    // Nếu tồn hệ thống > 0 và thực tế = 0 và có hàng hư hỏng → Cần kiểm tra
                    if (detail.SystemQuantity > 0 && detail.ActualQuantity == 0 && detail.DamageQuantity == 0)
                    {
                        // Tất cả hàng biến mất nhưng không có lý do → Cảnh báo
                        // Cho phép nhưng có thể log
                    }
                }

                // Process each variance
                foreach (var detail in stockTake.StockTakeDetails)
                {
                    // Get current balance
                    var currentBalance = await _db.InventoryDetails
                        .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                        .SumAsync(id => (int?)id.QuantityRemaining) ?? 0;

                    // Nếu không có thay đổi gì (cả variance và damage đều = 0)
                    if (detail.Variance == 0 && detail.DamageQuantity == 0)
                        continue;

                    int runningBalance = currentBalance;

                    // BƯỚC 1: Xử lý hàng hư hỏng TRƯỚC - BẮT BUỘC trừ khỏi tồn kho
                    if (detail.DamageQuantity > 0)
                    {
                        // Trừ hàng hư hỏng từ InventoryDetail (FIFO)
                        int qtyToDeduct = detail.DamageQuantity;
                        var lots = await _db.InventoryDetails
                            .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                            .OrderBy(id => id.ReceivedDate)
                            .ThenBy(id => id.InventoryDetailId)
                            .ToListAsync();

                        foreach (var lot in lots)
                        {
                            if (qtyToDeduct <= 0) break;

                            int deduct = Math.Min(lot.QuantityRemaining, qtyToDeduct);
                            lot.QuantityRemaining -= deduct;
                            qtyToDeduct -= deduct;
                        }
                        
                        // Cập nhật balance sau khi trừ hàng hư hỏng
                        runningBalance -= detail.DamageQuantity;
                        
                        // Tạo InventoryLog cho hàng hư hỏng - LƯU THÔNG TIN
                        var damageLog = new InventoryLog
                    {
                        ProductId = detail.ProductId,
                            InventoryDetailId = null,
                        TransactionDate = DateTime.Now,
                            TransactionType = "DAMAGE", // Loại giao dịch cho hàng hư hỏng
                            QuantityChange = -detail.DamageQuantity, // Trừ đi hàng hư hỏng
                            BalanceAfter = runningBalance, // Balance sau khi trừ hàng hư
                        ReferenceId = stockTake.StockTakeId,
                        ReferenceType = "STOCKTAKE",
                        UserId = stockTake.CreatedByUserId
                    };
                        _db.InventoryLogs.Add(damageLog);
                        
                        // Lưu thông tin hư hỏng: DamageQuantity và DamageReason đã được lưu trong StockTakeDetail
                        // Có thể query lại StockTakeDetail để xem thông tin chi tiết
                    }

                    // BƯỚC 2: Xử lý điều chỉnh số lượng tốt (variance)
                    if (detail.Variance != 0)
                    {
                        runningBalance += detail.Variance;
                        
                        // Tạo InventoryLog cho điều chỉnh
                        var varianceLog = new InventoryLog
                        {
                            ProductId = detail.ProductId,
                            InventoryDetailId = null,
                            TransactionDate = DateTime.Now,
                            TransactionType = "ADJUST",
                            QuantityChange = detail.Variance,
                            BalanceAfter = runningBalance,
                            ReferenceId = stockTake.StockTakeId,
                            ReferenceType = "STOCKTAKE",
                            UserId = stockTake.CreatedByUserId
                        };
                        _db.InventoryLogs.Add(varianceLog);
                        
                        // Update InventoryDetail lots
                        if (detail.Variance > 0)
                    {
                        // Increase: Add to oldest lot or create new lot
                        var oldestLot = await _db.InventoryDetails
                            .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                            .OrderBy(id => id.ReceivedDate)
                            .FirstOrDefaultAsync();

                        if (oldestLot != null)
                        {
                                oldestLot.QuantityRemaining += detail.Variance;
                        }
                        else
                        {
                            // Create new lot for adjustment
                            var newLot = new InventoryDetail
                            {
                                ProductId = detail.ProductId,
                                    ReceivingDetailId = null, // No receiving for adjustment
                                    QuantityIn = detail.Variance,
                                    QuantityRemaining = detail.Variance,
                                Unit = detail.Product.Unit ?? "pcs",
                                Price = 0, // No price for adjustment
                                ReceivedDate = DateTime.Now
                            };
                            _db.InventoryDetails.Add(newLot);
                        }
                    }
                        else if (detail.Variance < 0)
                    {
                        // Decrease: Deduct from lots using FIFO
                            int qtyToDeduct = Math.Abs(detail.Variance);
                        var lots = await _db.InventoryDetails
                            .Where(id => id.ProductId == detail.ProductId && id.QuantityRemaining > 0)
                            .OrderBy(id => id.ReceivedDate)
                                .ThenBy(id => id.InventoryDetailId)
                            .ToListAsync();

                        foreach (var lot in lots)
                        {
                            if (qtyToDeduct <= 0) break;

                            int deduct = Math.Min(lot.QuantityRemaining, qtyToDeduct);
                            lot.QuantityRemaining -= deduct;
                            qtyToDeduct -= deduct;
                        }
                    }
                    }

                    // Inventory summary không còn cần thiết - tính từ InventoryDetail khi cần
                }

                stockTake.Status = "Completed";
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Hoàn tất kiểm kê thành công. Tồn kho đã được điều chỉnh." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error completing stock take: {Message}", ex.Message);
                
                // Hiển thị inner exception nếu có
                string errorMessage = ex.Message;
                if (ex.InnerException != null)
                {
                    errorMessage += $" | Chi tiết: {ex.InnerException.Message}";
                }
                
                return StatusCode(500, $"Lỗi: {errorMessage}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var stockTake = await _db.StockTakes
                    .Include(st => st.StockTakeDetails)
                    .FirstOrDefaultAsync(st => st.StockTakeId == id);

                if (stockTake == null)
                    return NotFound("Phiếu kiểm kê không tồn tại");

                if (stockTake.Status == "Completed")
                    return BadRequest("Không thể xóa phiếu kiểm kê đã hoàn tất");

                _db.StockTakes.Remove(stockTake);
                await _db.SaveChangesAsync();

                return Ok("Đã xóa phiếu kiểm kê");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting stock take: {Message}", ex.Message);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }
    }
}

