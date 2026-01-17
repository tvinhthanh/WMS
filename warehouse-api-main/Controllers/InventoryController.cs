using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.DTO;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly WmsDbContext _db;

        public InventoryController(WmsDbContext db)
        {
            _db = db;
        }

        // GET ALL INVENTORY - Tính từ InventoryDetail, gộp theo ProductName
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // ✅ Tối ưu: Thêm pagination để tránh load quá nhiều data
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50; // Giới hạn tối đa 100 items/page

            // Tính tổng quantity từ InventoryDetail, GROUP theo ProductName để gộp các sản phẩm cùng tên
            var query = _db.InventoryDetails
                .Include(id => id.Product)
                .Where(id => id.QuantityRemaining > 0)
                .AsNoTracking() // Read-only query, không cần tracking
                .GroupBy(id => id.Product.ProductName) // Group theo ProductName thay vì ProductId
                .Select(g => new
                {
                    ProductName = g.Key,
                    ProductId = g.First().ProductId, // Lấy ProductId đầu tiên làm đại diện
                    Quantity = g.Sum(id => id.QuantityRemaining), // Tổng số lượng của tất cả các sản phẩm cùng tên
                    LastUpdate = g.Max(id => id.ReceivedDate) // Ngày cập nhật mới nhất
                });

            var totalCount = await query.CountAsync();

            var inventoryData = await query
                .OrderBy(inv => inv.ProductName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Tạo kết quả - chỉ hiển thị sản phẩm có tồn kho > 0
            var result = inventoryData.Select(inv => new InventoryDTO
            {
                InventoryId = 0,
                ProductId = inv.ProductId,
                ProductName = inv.ProductName,
                Quantity = inv.Quantity,
                LastUpdate = inv.LastUpdate
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

        // GET INVENTORY MOVEMENTS (Logs) - Phải đặt trước route có tham số
        [HttpGet("movements")]
        public async Task<IActionResult> GetMovements(
            [FromQuery] int? productId = null,
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var query = _db.InventoryLogs
                .Include(log => log.Product)
                .Include(log => log.User)
                .AsNoTracking() // Read-only query
                .AsQueryable();

            if (productId.HasValue)
                query = query.Where(log => log.ProductId == productId.Value);

            if (from.HasValue)
                query = query.Where(log => log.TransactionDate >= from.Value);

            if (to.HasValue)
                query = query.Where(log => log.TransactionDate <= to.Value.AddDays(1)); // Include full day

            var movements = await query
                .OrderByDescending(log => log.TransactionDate)
                .ThenByDescending(log => log.InventoryLogId)
                .Select(log => new InventoryLogDTO
                {
                    InventoryLogId = log.InventoryLogId,
                    ProductId = log.ProductId,
                    ProductName = log.Product.ProductName,
                    InventoryDetailId = log.InventoryDetailId,
                    TransactionDate = log.TransactionDate,
                    TransactionType = log.TransactionType,
                    QuantityChange = log.QuantityChange,
                    BalanceAfter = log.BalanceAfter,
                    ReferenceId = log.ReferenceId,
                    ReferenceType = log.ReferenceType,
                    UserId = log.UserId,
                    UserName = log.User != null ? log.User.FullName : null
                })
                .ToListAsync();

            return Ok(movements);
        }

        // GET INVENTORY SUMMARY (Beginning, IN, OUT, Adjust, Ending) - Phải đặt trước route có tham số
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] int? productId = null,
            [FromQuery] DateTime? date = null)
        {
            var targetDate = date ?? DateTime.Now.Date;
            var startOfDay = targetDate.Date;
            var endOfDay = targetDate.Date.AddDays(1).AddTicks(-1);

            var query = _db.InventoryLogs
                .Include(log => log.Product)
                .AsNoTracking() // Read-only query
                .AsQueryable();

            if (productId.HasValue)
                query = query.Where(log => log.ProductId == productId.Value);

            // Get beginning balance (last balance before start of day)
            var beginningLog = await query
                .Where(log => log.TransactionDate < startOfDay)
                .OrderByDescending(log => log.TransactionDate)
                .ThenByDescending(log => log.InventoryLogId)
                .FirstOrDefaultAsync();

            int beginningBalance = beginningLog?.BalanceAfter ?? 0;

            // Get transactions for the day
            var dayLogs = await query
                .Where(log => log.TransactionDate >= startOfDay && log.TransactionDate <= endOfDay)
                .ToListAsync();

            int totalIN = dayLogs
                .Where(log => log.TransactionType == "IN")
                .Sum(log => log.QuantityChange);

            int totalOUT = Math.Abs(dayLogs
                .Where(log => log.TransactionType == "OUT")
                .Sum(log => log.QuantityChange));

            int totalAdjust = dayLogs
                .Where(log => log.TransactionType == "ADJUST")
                .Sum(log => log.QuantityChange);

            // Get ending balance (last balance of the day, or beginning if no transactions)
            var endingLog = dayLogs
                .OrderByDescending(log => log.TransactionDate)
                .ThenByDescending(log => log.InventoryLogId)
                .FirstOrDefault();

            int endingBalance = endingLog?.BalanceAfter ?? beginningBalance;

            // If productId specified, return single summary
            if (productId.HasValue)
            {
                var product = await _db.Products.FindAsync(productId.Value);
                if (product == null)
                    return NotFound("Sản phẩm không tồn tại.");

                return Ok(new InventorySummaryDTO
                {
                    ProductId = productId.Value,
                    ProductName = product.ProductName,
                    BeginningBalance = beginningBalance,
                    TotalIN = totalIN,
                    TotalOUT = totalOUT,
                    TotalAdjust = totalAdjust,
                    EndingBalance = endingBalance,
                    FromDate = startOfDay,
                    ToDate = endOfDay
                });
            }

            // If no productId, return summary for all products
            // ✅ Tối ưu: Sử dụng database aggregation thay vì load tất cả vào memory
            var summaries = await _db.Products
                .AsNoTracking()
                .Select(p => new
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    // Beginning balance: last balance before start of day
                    BeginningBalance = _db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId && log.TransactionDate < startOfDay)
                        .OrderByDescending(log => log.TransactionDate)
                        .ThenByDescending(log => log.InventoryLogId)
                        .Select(log => (int?)log.BalanceAfter)
                        .FirstOrDefault() ?? 0,
                    // Day transactions - tính toán trực tiếp trong database
                    TotalIN = _db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId 
                            && log.TransactionDate >= startOfDay 
                            && log.TransactionDate <= endOfDay
                            && log.TransactionType == "IN")
                        .Sum(log => (int?)log.QuantityChange) ?? 0,
                    TotalOUT = Math.Abs(_db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId 
                            && log.TransactionDate >= startOfDay 
                            && log.TransactionDate <= endOfDay
                            && log.TransactionType == "OUT")
                        .Sum(log => (int?)log.QuantityChange) ?? 0),
                    TotalAdjust = _db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId 
                            && log.TransactionDate >= startOfDay 
                            && log.TransactionDate <= endOfDay
                            && log.TransactionType == "ADJUST")
                        .Sum(log => (int?)log.QuantityChange) ?? 0,
                    // Ending balance: last balance of the day
                    EndingBalance = _db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId 
                            && log.TransactionDate >= startOfDay 
                            && log.TransactionDate <= endOfDay)
                        .OrderByDescending(log => log.TransactionDate)
                        .ThenByDescending(log => log.InventoryLogId)
                        .Select(log => (int?)log.BalanceAfter)
                        .FirstOrDefault() ?? _db.InventoryLogs
                        .Where(log => log.ProductId == p.ProductId && log.TransactionDate < startOfDay)
                        .OrderByDescending(log => log.TransactionDate)
                        .ThenByDescending(log => log.InventoryLogId)
                        .Select(log => (int?)log.BalanceAfter)
                        .FirstOrDefault() ?? 0
                })
                .ToListAsync();

            var result = summaries.Select(s => new InventorySummaryDTO
            {
                ProductId = s.ProductId,
                ProductName = s.ProductName,
                BeginningBalance = s.BeginningBalance,
                TotalIN = s.TotalIN,
                TotalOUT = s.TotalOUT,
                TotalAdjust = s.TotalAdjust,
                EndingBalance = s.EndingBalance,
                FromDate = startOfDay,
                ToDate = endOfDay
            }).ToList();

            return Ok(result);
        }

        // GET INVENTORY REPORT BY DATE RANGE - Phải đặt trước route có tham số
        [HttpGet("report")]
        public async Task<IActionResult> GetReport(
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null)
        {
            var startDate = fromDate?.Date ?? DateTime.Now.Date.AddDays(-30); // Mặc định 30 ngày gần nhất
            var endDate = (toDate?.Date ?? DateTime.Now.Date).AddDays(1).AddTicks(-1); // Đến cuối ngày

            // Tối ưu: Load tất cả data một lần thay vì N+1 queries
            var allProducts = await _db.Products
                .AsNoTracking()
                .ToListAsync();

            // Load tất cả logs liên quan một lần
            var allLogs = await _db.InventoryLogs
                .AsNoTracking()
                .Where(log => log.TransactionDate <= endDate)
                .OrderByDescending(log => log.TransactionDate)
                .ThenByDescending(log => log.InventoryLogId)
                .ToListAsync();

            var summaries = new List<InventorySummaryDTO>();

            foreach (var product in allProducts)
            {
                var productLogs = allLogs.Where(log => log.ProductId == product.ProductId).ToList();

                // Get beginning balance (last balance before start date)
                var beginningLog = productLogs
                    .Where(log => log.TransactionDate < startDate)
                    .FirstOrDefault();

                int beginningBalance = beginningLog?.BalanceAfter ?? 0;

                // Get transactions in date range
                var rangeLogs = productLogs
                    .Where(log => log.TransactionDate >= startDate && log.TransactionDate <= endDate)
                    .ToList();

                int totalIN = rangeLogs
                    .Where(log => log.TransactionType == "IN")
                    .Sum(log => log.QuantityChange);

                int totalOUT = Math.Abs(rangeLogs
                    .Where(log => log.TransactionType == "OUT")
                    .Sum(log => log.QuantityChange));

                int totalAdjust = rangeLogs
                    .Where(log => log.TransactionType == "ADJUST")
                    .Sum(log => log.QuantityChange);

                // Get ending balance (last balance in range, or beginning if no transactions)
                var endingLog = rangeLogs
                    .FirstOrDefault();

                int endingBalance = endingLog?.BalanceAfter ?? beginningBalance;

                summaries.Add(new InventorySummaryDTO
                {
                    ProductId = product.ProductId,
                    ProductName = product.ProductName,
                    BeginningBalance = beginningBalance,
                    TotalIN = totalIN,
                    TotalOUT = totalOUT,
                    TotalAdjust = totalAdjust,
                    EndingBalance = endingBalance,
                    FromDate = startDate,
                    ToDate = endDate
                });
            }

            return Ok(summaries);
        }

        // GET INVENTORY DETAILS (FIFO Lots) for a product
        [HttpGet("details/{productId}")]
        public async Task<IActionResult> GetInventoryDetails(int productId)
        {
            var details = await _db.InventoryDetails
                .Include(id => id.Product)
                .Include(id => id.ReceivingDetail)
                    .ThenInclude(rd => rd.Receiving)
                        .ThenInclude(ro => ro.Partner)
                .Include(id => id.ProductSeries)
                .Where(id => id.ProductId == productId && id.QuantityRemaining > 0)
                .AsNoTracking()
                .OrderBy(id => id.ReceivedDate)
                .ToListAsync();

            var result = details.Select(id => new InventoryDetailDTO
            {
                InventoryDetailId = id.InventoryDetailId,
                ProductId = id.ProductId,
                ProductName = id.Product.ProductName,
                ReceivingDetailId = id.ReceivingDetailId,
                QuantityIn = id.QuantityIn,
                QuantityRemaining = id.QuantityRemaining,
                Unit = id.Unit,
                Price = id.Price,
                ReceivedDate = id.ReceivedDate,
                PartnerId = id.ReceivingDetail?.Receiving?.PartnerId,
                PartnerName = id.ReceivingDetail?.Receiving?.Partner?.PartnerName,
                SerialNumbers = id.ProductSeries
                    .Where(ps => ps.Status == "InStock")
                    .Select(ps => new SerialNumberInfo
                    {
                        ProductSeriesId = ps.ProductSeriesId,
                        SerialNumber = ps.SerialNumber,
                        Status = ps.Status
                    })
                    .OrderBy(ps => ps.SerialNumber)
                    .ToList()
            }).ToList();

            return Ok(result);
        }


        // GET ONE - Tính từ InventoryDetail - Phải đặt SAU các route cụ thể
        [HttpGet("{productId}")]
        public async Task<IActionResult> GetByProductId(int productId)
        {
            var product = await _db.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProductId == productId);
            if (product == null) return NotFound("Sản phẩm không tồn tại.");

            // Tính tổng quantity từ InventoryDetail
            var quantity = await _db.InventoryDetails
                .AsNoTracking()
                .Where(id => id.ProductId == productId && id.QuantityRemaining > 0)
                .SumAsync(id => (int?)id.QuantityRemaining) ?? 0;

            // Lấy ngày nhập mới nhất
            var lastUpdate = await _db.InventoryDetails
                .AsNoTracking()
                .Where(id => id.ProductId == productId)
                .OrderByDescending(id => id.ReceivedDate)
                .Select(id => id.ReceivedDate)
                .FirstOrDefaultAsync();

            return Ok(new InventoryDTO
            {
                InventoryId = 0, // Không còn bảng Inventory nữa
                ProductId = productId,
                ProductName = product.ProductName,
                Quantity = quantity,
                LastUpdate = lastUpdate != default ? lastUpdate : DateTime.MinValue
            });
        }
    }
}
