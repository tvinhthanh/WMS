using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS1.DTO;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceivingController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private readonly ILogger<ReceivingController> _logger;

        public ReceivingController(WmsDbContext db, ILogger<ReceivingController> logger)
        {
            _db = db;
            _logger = logger;
        }

        private async Task<string> GenerateOrderCode()
        {
            int count = await _db.Receivings.CountAsync() + 1;
            return $"PN-{count:D3}";
        }

        private async Task<string> GenerateDeliveryCode()
        {
            // Lấy số thứ tự từ DeliveryCode hiện có (PG-001, PG-002, ...)
            var existingCodes = await _db.Receivings
                .Where(r => r.DeliveryCode != null && r.DeliveryCode.StartsWith("PG-"))
                .Select(r => r.DeliveryCode)
                .ToListAsync();

            int maxNumber = 0;
            foreach (var code in existingCodes)
            {
                if (int.TryParse(code?.Replace("PG-", ""), out int number))
                {
                    if (number > maxNumber)
                        maxNumber = number;
                }
            }

            int nextNumber = maxNumber + 1;
            return $"PG-{nextNumber:D3}";
        }

        private async Task<string> GenerateReturnPickingCode()
        {
            int count = await _db.PickingOrders.CountAsync() + 1;
            return $"RTN-{count:D3}";
        }

        private const int DAMAGE_RETURN_THRESHOLD = 20; // Ngưỡng tự tạo phiếu xuất trả

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

        // TỰ ĐỘNG TẠO PHIẾU XUẤT TRẢ VÀ PHIẾU NHẬP MỚI KHI PHÁT HIỆN HÀNG LỖI TRONG PHIẾU NHẬP
        // Không dùng transaction riêng vì method này được gọi từ trong transaction của UpdateActual
        private async Task CreateReturnAndReplacementOrdersAsync(Receiving originalReceiving, List<ReceivingDetail> damagedDetails)
        {
            try
            {
                // 1. Tạo phiếu xuất trả (PickingOrder) để trả hàng lỗi về nhà cung cấp
                var returnPickingOrder = new PickingOrder
                {
                    OrderCode = await GenerateReturnPickingCode(),
                    CreateByUserId = originalReceiving.UserId,
                    PartnerId = originalReceiving.PartnerId,
                    CreateDate = DateTime.Now,
                    Status = "Pending"
                };
                _db.PickingOrders.Add(returnPickingOrder);
                await _db.SaveChangesAsync();

                // 2. Tạo chi tiết phiếu xuất trả
                foreach (var damagedDetail in damagedDetails)
                {
                    var pickingDetail = new PickingDetail
                    {
                        PickingOrderId = returnPickingOrder.PickingOrderId,
                        ProductId = damagedDetail.ProductId,
                        QuantityPicked = damagedDetail.DamageQuantity ?? 0,
                        UnitPrice = damagedDetail.Price / (damagedDetail.Quantity > 0 ? damagedDetail.Quantity : 1),
                        SerialNumbers = null // Hàng lỗi không có SerialNumber
                    };
                    _db.PickingDetails.Add(pickingDetail);
                }
                await _db.SaveChangesAsync();

                // 3. Tạo phiếu nhập mới để nhận hàng thay thế
                var replacementReceiving = new Receiving
                {
                    OrderCode = await GenerateOrderCode(),
                    UserId = originalReceiving.UserId,
                    PartnerId = originalReceiving.PartnerId,
                    DeliveryCode = null,
                    ReceivedDate = DateTime.Now,
                    CreatedDate = DateTime.Now,
                    Status = 0, // Pending - cần nhập số lượng thực tế
                    Note = $"Hàng cũ bị lỗi đổi hàng khác từ phiếu nhập {originalReceiving.OrderCode}"
                };
                _db.Receivings.Add(replacementReceiving);
                await _db.SaveChangesAsync();

                // 4. Tạo chi tiết phiếu nhập mới (số lượng bằng số lượng hàng lỗi)
                foreach (var damagedDetail in damagedDetails)
                {
                    var replacementDetail = new ReceivingDetail
                    {
                        ReceivingId = replacementReceiving.ReceivingId,
                        ProductId = damagedDetail.ProductId,
                        Quantity = damagedDetail.DamageQuantity ?? 0,
                        ActualQuantity = null, // Chưa nhập, cần cập nhật sau
                        DamageQuantity = null,
                        DamageReason = null,
                        Unit = damagedDetail.Unit,
                        Price = damagedDetail.Price / (damagedDetail.Quantity > 0 ? damagedDetail.Quantity : 1) * (damagedDetail.DamageQuantity ?? 0)
                    };
                    _db.ReceivingDetails.Add(replacementDetail);
                }
                await _db.SaveChangesAsync();

                // 5. Lưu PendingDamage để theo dõi (giữ logic cũ cho trường hợp hàng bị lỗi sau khi nhập kho)
                foreach (var damagedDetail in damagedDetails)
                {
                    await AddPendingDamageAsync(
                        damagedDetail.ProductId,
                        originalReceiving.PartnerId,
                        damagedDetail.ReceivingDetailId,
                        damagedDetail.DamageQuantity ?? 0,
                        damagedDetail.DamageReason,
                        "RECEIVING",
                        originalReceiving.ReceivingId,
                        DateTime.Now,
                        originalReceiving.ReceivedDate);
                }

                // Không commit transaction ở đây vì method này được gọi từ trong transaction của UpdateActual
                // Transaction sẽ được commit/rollback bởi method gọi nó

                _logger.LogInformation(
                    "Đã tạo phiếu xuất trả {ReturnOrderCode} và phiếu nhập thay thế {ReplacementOrderCode} từ phiếu nhập {OriginalOrderCode}",
                    returnPickingOrder.OrderCode,
                    replacementReceiving.OrderCode,
                    originalReceiving.OrderCode);
            }
            catch (Exception ex)
            {
                // Không rollback transaction ở đây vì method này được gọi từ trong transaction của UpdateActual
                // Transaction sẽ được rollback bởi method gọi nó
                _logger.LogError(ex, "Lỗi khi tạo phiếu xuất trả và phiếu nhập thay thế từ phiếu nhập {OrderCode}", originalReceiving.OrderCode);
                throw;
            }
        }

        private async Task CheckAndAutoCreateReturnOrdersAsync(int createByUserId)
        {
            // Gom theo Partner + Product, chỉ những nhóm đạt ngưỡng
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

            // Tạo đơn theo Partner, gồm các sản phẩm đủ ngưỡng
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

                // Gắn các pending damages vào đơn và đánh dấu queued
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
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // Tối ưu: Thêm pagination để tránh load quá nhiều data
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50; // Giới hạn tối đa 100 items/page

            var totalCount = await _db.Receivings.CountAsync();

            var data = await _db.Receivings
                        .Include(r => r.User)
                        .Include(r => r.Partner)
                        .AsNoTracking() // Read-only query
                        .OrderByDescending(r => r.ReceivingId)
                        .Skip((page - 1) * pageSize)
                        .Take(pageSize)
                        .Select(r => new ReceivingDTO
                        {
                            ReceivingId = r.ReceivingId,
                            OrderCode = r.OrderCode,
                            UserId = r.UserId,
                            UserName = r.User.FullName,
                            ReceivedDate = r.ReceivedDate,
                            CreatedDate = r.CreatedDate,
                            Status = r.Status,
                            Note = r.Note,
                            PartnerId = r.PartnerId,
                            PartnerName = r.Partner.PartnerName,
                            DeliveryCode = r.DeliveryCode,
                            Details = new List<ReceivingDetailDTO>()
                        })
                        .ToListAsync();

            return Ok(new
            {
                data = data,
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
            var r = await _db.Receivings
                .Include(r => r.User)
                .Include(r => r.Partner)
                .Include(r => r.ReceivingDetails)
                .ThenInclude(d => d.Product)
                .AsNoTracking() // Read-only query
                .FirstOrDefaultAsync(r => r.ReceivingId == id);

            if (r == null) return NotFound("Không tìm thấy phiếu nhập.");

            // Lấy danh sách InventoryDetailIds từ ReceivingDetails để query SerialNumbers
            var receivingDetailIds = r.ReceivingDetails.Select(rd => rd.ReceivingDetailId).ToList();
            
            // Lấy InventoryDetails tương ứng với ReceivingDetails
            var inventoryDetails = await _db.InventoryDetails
                .Where(id => receivingDetailIds.Contains(id.ReceivingDetailId ?? 0))
                .ToListAsync();

            var inventoryDetailIds = inventoryDetails.Select(id => id.InventoryDetailId).ToList();

            // Lấy tất cả SerialNumbers theo InventoryDetailId (load về memory trước, sau đó group)
            var allProductSeries = await _db.ProductSeries
                .Where(ps => inventoryDetailIds.Contains(ps.InventoryDetailId ?? 0))
                .Select(ps => new { ps.InventoryDetailId, ps.SerialNumber })
                .ToListAsync();

            // Group và tạo dictionary trong memory
            var serialNumbersByInventory = allProductSeries
                .Where(ps => ps.InventoryDetailId.HasValue)
                .GroupBy(ps => ps.InventoryDetailId!.Value)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(ps => ps.SerialNumber).OrderBy(sn => sn).ToList()
                );

            // Map ReceivingDetailId với InventoryDetailId
            var receivingToInventoryMap = inventoryDetails
                .Where(id => id.ReceivingDetailId.HasValue)
                .ToDictionary(
                    id => id.ReceivingDetailId!.Value,
                    id => id.InventoryDetailId
                );

            return Ok(new ReceivingDTO
            {
                ReceivingId = r.ReceivingId,
                OrderCode = r.OrderCode,
                UserId = r.UserId,
                UserName = r.User.FullName,
                ReceivedDate = r.ReceivedDate,
                CreatedDate = r.CreatedDate,
                Status = r.Status,
                Note = r.Note,
                PartnerId = r.PartnerId,
                PartnerName = r.Partner.PartnerName,
                DeliveryCode = r.DeliveryCode,
                Details = r.ReceivingDetails.Select(d => 
                {
                    // Tìm SerialNumbers từ InventoryDetail tương ứng
                    List<string>? serials = null;
                    if (receivingToInventoryMap.ContainsKey(d.ReceivingDetailId))
                    {
                        var inventoryId = receivingToInventoryMap[d.ReceivingDetailId];
                        if (serialNumbersByInventory.ContainsKey(inventoryId))
                        {
                            serials = serialNumbersByInventory[inventoryId];
                        }
                    }

                    return new ReceivingDetailDTO
                {
                    ReceivingDetailId = d.ReceivingDetailId,
                    ProductId = d.ProductId,
                    ProductName = d.Product.ProductName,
                    Unit = d.Unit,
                    Price = d.Price,
                    Quantity = d.Quantity,
                    ActualQuantity = d.ActualQuantity,
                    DamageQuantity = d.DamageQuantity,
                        DamageReason = d.DamageReason,
                        SerialNumbers = serials
                    };
                }).ToList()
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReceivingCreateDTO dto)
        {
            // Sử dụng transaction để đảm bảo data consistency
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Validation: Kiểm tra DTO
                if (dto == null)
                    return BadRequest("Dữ liệu không hợp lệ.");

                if (dto.Details == null || dto.Details.Count == 0)
                    return BadRequest("Phiếu nhập phải có ít nhất 1 sản phẩm.");

                // Validation: Kiểm tra UserId và PartnerId
                if (dto.UserId <= 0)
                    return BadRequest("UserId không hợp lệ.");

                if (dto.PartnerId <= 0)
                    return BadRequest("PartnerId không hợp lệ.");

                // Validation: Kiểm tra từng sản phẩm trong Details
                for (int i = 0; i < dto.Details.Count; i++)
                {
                    var item = dto.Details[i];
                    if (item.ProductId <= 0)
                        return BadRequest($"Sản phẩm thứ {i + 1}: ProductId không hợp lệ.");

                    if (item.Quantity <= 0)
                        return BadRequest($"Sản phẩm thứ {i + 1}: Số lượng phải lớn hơn 0.");

                    if (item.Price < 0)
                        return BadRequest($"Sản phẩm thứ {i + 1}: Giá không được âm.");

                    if (string.IsNullOrWhiteSpace(item.Unit))
                        return BadRequest($"Sản phẩm thứ {i + 1}: Đơn vị không được để trống.");

                    // Kiểm tra ProductId có tồn tại trong database không
                    var productExists = await _db.Products.AnyAsync(p => p.ProductId == item.ProductId);
                    if (!productExists)
                        return BadRequest($"Sản phẩm thứ {i + 1}: Không tìm thấy sản phẩm với ProductId = {item.ProductId}.");
                }

                //  Validation: Kiểm tra tổng giá trị phiếu nhập không được vượt quá 6 tỷ
                decimal totalAmount = dto.Details.Sum(d => d.Price * d.Quantity);
                const decimal MAX_TOTAL_AMOUNT = 6_000_000_000m; // 6 tỷ

                if (totalAmount > MAX_TOTAL_AMOUNT)
                {
                    return BadRequest($"Tổng giá trị phiếu nhập ({totalAmount:N0} VNĐ) vượt quá giới hạn cho phép ({MAX_TOTAL_AMOUNT:N0} VNĐ). Vui lòng chia nhỏ phiếu nhập.");
                }

                var receiving = new Receiving
                {
                    OrderCode = await GenerateOrderCode(),
                    UserId = dto.UserId,
                    PartnerId = dto.PartnerId,
                    DeliveryCode = !string.IsNullOrWhiteSpace(dto.DeliveryCode) ? dto.DeliveryCode : await GenerateDeliveryCode(),
                    Note = dto.Note,
                    Status = 0,
                    ReceivedDate = DateTime.Now,
                    CreatedDate = DateTime.Now
                };

                _db.Receivings.Add(receiving);
                //  Tối ưu: Lưu Receiving trước để có ReceivingId, sau đó thêm tất cả Details và save một lần
                await _db.SaveChangesAsync();

                // Tối ưu: Sử dụng AddRange thay vì Add trong loop
                var receivingDetails = dto.Details.Select(item => new ReceivingDetail
                    {
                        ReceivingId = receiving.ReceivingId,
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        Unit = item.Unit,
                        Price = item.Price,
                        ActualQuantity = null,
                        DamageQuantity = item.DamageQuantity ?? 0,
                        DamageReason = item.DamageReason
                }).ToList();

                _db.ReceivingDetails.AddRange(receivingDetails);
                await _db.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new { message = "Tạo phiếu nhập thành công", receivingId = receiving.ReceivingId });
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi database khi tạo phiếu nhập");
                return StatusCode(500, "Lỗi khi lưu dữ liệu vào database.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Lỗi không xác định khi tạo phiếu nhập");
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        [HttpPost("update-actual")]
        public async Task<IActionResult> UpdateActual([FromBody] ReceivingActualUpdateDTO dto)
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            try
            {
                var receiving = await _db.Receivings
                    .Include(r => r.ReceivingDetails)
                    .FirstOrDefaultAsync(r => r.ReceivingId == dto.ReceivingId);

                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                if (dto.Items == null || dto.Items.Count == 0)
                    return BadRequest("Không có dữ liệu cập nhật.");

                // Update Actual Quantity
                foreach (var item in dto.Items)
                {
                    var detail = receiving.ReceivingDetails
                        .FirstOrDefault(d => d.ReceivingDetailId == item.ReceivingDetailId);

                    if (detail != null)
                    {
                        detail.ActualQuantity = item.ActualQuantity;
                        detail.DamageQuantity = item.DamageQuantity;
                        detail.DamageReason = item.DamageReason;
                        
                        if (item.Price.HasValue)
                        {
                            detail.Price = item.Price.Value;
                        }
                    }
                }

                // Check status (đã khai báo đủ số lượng thực tế + hư hỏng)
                bool allCompleted = receiving.ReceivingDetails
                    .All(d => d.ActualQuantity != null &&
                              (d.ActualQuantity ?? 0) + (d.DamageQuantity ?? 0) == d.Quantity);

                bool anyActual = receiving.ReceivingDetails
                    .Any(d => (d.ActualQuantity ?? 0) > 0 || (d.DamageQuantity ?? 0) > 0);

                //  KIỂM TRA HÀNG LỖI TRƯỚC - Tự động tạo phiếu xuất trả và phiếu nhập mới ngay khi có hàng lỗi
                var damagedDetails = receiving.ReceivingDetails.Where(x => (x.DamageQuantity ?? 0) > 0).ToList();
                if (damagedDetails.Any())
                {
                    // Kiểm tra xem đã tạo phiếu xuất trả và phiếu nhập mới chưa (tránh tạo trùng)
                    // Kiểm tra qua PendingDamage với SourceId = ReceivingId
                    var existingPendingDamages = await _db.PendingDamages
                        .Where(pd => pd.SourceType == "RECEIVING" 
                                  && pd.SourceId == receiving.ReceivingId
                                  && pd.PickingOrderId != null)
                        .AnyAsync();

                    if (!existingPendingDamages)
                    {
                        await CreateReturnAndReplacementOrdersAsync(receiving, damagedDetails);
                    }
                }

                if (allCompleted)
                {
                    receiving.Status = 1; // Completed

                    // Ghi nhận hàng tốt vào tồn kho
                    foreach (var d in receiving.ReceivingDetails)
                    {
                        var goodQty = d.ActualQuantity ?? 0;
                        if (goodQty <= 0)
                            continue;

                        var balanceBefore = await _db.InventoryDetails
                            .Where(id => id.ProductId == d.ProductId && id.QuantityRemaining > 0)
                            .SumAsync(id => (int?)id.QuantityRemaining) ?? 0;

                        var inventoryDetail = new InventoryDetail
                        {
                            ProductId = d.ProductId,
                            ReceivingDetailId = d.ReceivingDetailId,
                            QuantityIn = goodQty,
                            QuantityRemaining = goodQty,
                            Unit = d.Unit,
                            Price = d.Price,
                            ReceivedDate = receiving.ReceivedDate
                        };
                        _db.InventoryDetails.Add(inventoryDetail);
                        await _db.SaveChangesAsync(); // lấy InventoryDetailId

                        var balanceAfter = balanceBefore + goodQty;

                        var inventoryLog = new InventoryLog
                        {
                            ProductId = d.ProductId,
                            InventoryDetailId = inventoryDetail.InventoryDetailId,
                            TransactionDate = DateTime.Now,
                            TransactionType = "IN",
                            QuantityChange = goodQty,
                            BalanceAfter = balanceAfter,
                            ReferenceId = receiving.ReceivingId,
                            ReferenceType = "RECEIVING",
                            UserId = receiving.UserId
                        };
                        _db.InventoryLogs.Add(inventoryLog);

                        //  TỰ ĐỘNG TẠO SERIAL NUMBER CHO TỪNG SẢN PHẨM TRONG LÔ HÀNG
                        var product = await _db.Products.FindAsync(d.ProductId);
                        if (product != null)
                        {
                            var seriesList = new List<ProductSeries>();
                            for (int i = 1; i <= goodQty; i++)
                            {
                                // Format: {ProductCode}-{ReceivingId}-{SequentialNumber}
                                // Ví dụ: SP001-PN001-0001, SP001-PN001-0002, ...
                                var serialNumber = $"{product.ProductCode}-{receiving.OrderCode}-{i:D4}";
                                
                                seriesList.Add(new ProductSeries
                                {
                                    ProductId = d.ProductId,
                                    InventoryDetailId = inventoryDetail.InventoryDetailId,
                                    SerialNumber = serialNumber,
                                    Status = "InStock",
                                    ReceivedDate = receiving.ReceivedDate,
                                    Notes = $"Tự động tạo từ phiếu nhập {receiving.OrderCode}"
                                });
                            }
                            
                            if (seriesList.Any())
                            {
                                _db.ProductSeries.AddRange(seriesList);
                                await _db.SaveChangesAsync();
                            }
                        }
                    }
                }
                else if (anyActual)
                {
                    receiving.Status = 2; // Partial
                }
                else
                {
                    receiving.Status = 0;
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Cập nhật số lượng thực tế thành công.",
                    status = receiving.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        //HỦY PHIẾU NHẬP ĐANG PENDING
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                var receiving = await _db.Receivings
                    .FirstOrDefaultAsync(r => r.ReceivingId == id);

                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                // Chỉ cho phép hủy khi phiếu đang ở trạng thái Pending (Status = 0) hoặc Partial (Status = 2)
                // Không cho phép hủy khi đã Completed (Status = 1) hoặc đã Cancelled (Status = 3)
                if (receiving.Status == 1)
                    return BadRequest("Không thể hủy phiếu nhập đã hoàn tất.");
                
                if (receiving.Status == 3)
                    return BadRequest("Phiếu nhập đã được hủy trước đó.");

                // Cho phép hủy khi Status = 0 (Pending) hoặc Status = 2 (Partial)
                // Cập nhật trạng thái thành Cancelled (Status = 3)
                receiving.Status = 3;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Hủy phiếu nhập thành công.",
                    receivingId = receiving.ReceivingId,
                    orderCode = receiving.OrderCode,
                    status = receiving.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // CẬP NHẬT MÃ PHIẾU GIAO HÀNG BẰNG TAY
        [HttpPut("{id}/delivery-code")]
        public async Task<IActionResult> UpdateDeliveryCode(int id, [FromBody] UpdateDeliveryCodeDTO dto)
        {
            try
            {
                // Validation: Kiểm tra DTO
                if (dto == null)
                    return BadRequest("Dữ liệu không hợp lệ.");

                var receiving = await _db.Receivings
                    .FirstOrDefaultAsync(r => r.ReceivingId == id);

                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                // Validation: Kiểm tra độ dài mã phiếu giao hàng (tối đa 50 ký tự)
                string? newDeliveryCode = string.IsNullOrWhiteSpace(dto.DeliveryCode) ? null : dto.DeliveryCode.Trim();
                
                if (newDeliveryCode != null)
                {
                    if (newDeliveryCode.Length > 50)
                        return BadRequest("Mã phiếu giao hàng không được vượt quá 50 ký tự.");

                    // Kiểm tra duplicate (nếu mã đã tồn tại ở phiếu nhập khác)
                    var existingReceiving = await _db.Receivings
                        .FirstOrDefaultAsync(r => r.ReceivingId != id && r.DeliveryCode == newDeliveryCode);

                    if (existingReceiving != null)
                        return BadRequest($"Mã phiếu giao hàng '{newDeliveryCode}' đã được sử dụng ở phiếu nhập khác (Mã phiếu: {existingReceiving.OrderCode}).");
                }

                // Cho phép cập nhật mã phiếu giao hàng cho tất cả các trạng thái
                // Đặc biệt hữu ích cho phiếu nhập thay thế khi hàng lỗi về
                receiving.DeliveryCode = newDeliveryCode;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Cập nhật mã phiếu giao hàng thành công.",
                    receivingId = receiving.ReceivingId,
                    orderCode = receiving.OrderCode,
                    deliveryCode = receiving.DeliveryCode
                });
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Lỗi database khi cập nhật mã phiếu giao hàng cho ReceivingId {ReceivingId}", id);
                return StatusCode(500, "Lỗi khi lưu dữ liệu vào database.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xác định khi cập nhật mã phiếu giao hàng cho ReceivingId {ReceivingId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // IN PHIẾU NHẬP - Cho phép in sau khi tạo phiếu và có hàng, trước khi kiểm tra lại
        [HttpGet("{id}/print")]
        public async Task<IActionResult> Print(int id)
        {
            try
            {
                var receiving = await _db.Receivings
                    .Include(r => r.User)
                    .Include(r => r.Partner)
                    .Include(r => r.ReceivingDetails)
                        .ThenInclude(d => d.Product)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.ReceivingId == id);

                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                // Kiểm tra phiếu đã có hàng (có ReceivingDetails)
                if (receiving.ReceivingDetails == null || !receiving.ReceivingDetails.Any())
                    return BadRequest("Phiếu nhập chưa có hàng. Không thể in phiếu nhập trống.");

                // Lấy danh sách InventoryDetailIds từ ReceivingDetails để query SerialNumbers
                var receivingDetailIds = receiving.ReceivingDetails.Select(rd => rd.ReceivingDetailId).ToList();
                
                // Lấy InventoryDetails tương ứng với ReceivingDetails
                var inventoryDetails = await _db.InventoryDetails
                    .Where(id => receivingDetailIds.Contains(id.ReceivingDetailId ?? 0))
                    .ToListAsync();

                var inventoryDetailIds = inventoryDetails.Select(id => id.InventoryDetailId).ToList();

                // Lấy tất cả SerialNumbers theo InventoryDetailId
                var allProductSeries = await _db.ProductSeries
                    .Where(ps => inventoryDetailIds.Contains(ps.InventoryDetailId ?? 0))
                    .Select(ps => new { ps.InventoryDetailId, ps.SerialNumber })
                    .ToListAsync();

                // Group và tạo dictionary trong memory
                var serialNumbersByInventory = allProductSeries
                    .Where(ps => ps.InventoryDetailId.HasValue)
                    .GroupBy(ps => ps.InventoryDetailId!.Value)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(ps => ps.SerialNumber).OrderBy(sn => sn).ToList()
                    );

                // Map ReceivingDetailId với InventoryDetailId
                var receivingToInventoryMap = inventoryDetails
                    .Where(id => id.ReceivingDetailId.HasValue)
                    .ToDictionary(
                        id => id.ReceivingDetailId!.Value,
                        id => id.InventoryDetailId
                    );

                // Tính tổng tiền
                decimal totalAmount = receiving.ReceivingDetails.Sum(d => d.Price * (d.ActualQuantity ?? d.Quantity));

                var printData = new
                {
                    ReceivingId = receiving.ReceivingId,
                    OrderCode = receiving.OrderCode,
                    DeliveryCode = receiving.DeliveryCode,
                    ReceivedDate = receiving.ReceivedDate,
                    CreatedDate = receiving.CreatedDate,
                    Status = receiving.Status,
                    StatusText = receiving.Status == 0 ? "Tạm" : receiving.Status == 1 ? "Hoàn tất" : receiving.Status == 2 ? "Một phần" : "Đã hủy",
                    Note = receiving.Note,
                    User = new
                    {
                        UserId = receiving.UserId,
                        UserName = receiving.User?.FullName ?? "",
                        Email = receiving.User?.Email ?? ""
                    },
                    Partner = new
                    {
                        PartnerId = receiving.PartnerId,
                        PartnerName = receiving.Partner?.PartnerName ?? ""
                    },
                    Details = receiving.ReceivingDetails.Select(d =>
                    {
                        // Tìm SerialNumbers từ InventoryDetail tương ứng
                        List<string>? serials = null;
                        if (receivingToInventoryMap.ContainsKey(d.ReceivingDetailId))
                        {
                            var inventoryId = receivingToInventoryMap[d.ReceivingDetailId];
                            if (serialNumbersByInventory.ContainsKey(inventoryId))
                            {
                                serials = serialNumbersByInventory[inventoryId];
                            }
                        }

                        return new
                        {
                            ReceivingDetailId = d.ReceivingDetailId,
                            ProductId = d.ProductId,
                            ProductCode = d.Product?.ProductCode ?? "",
                            ProductName = d.Product?.ProductName ?? "",
                            Unit = d.Unit,
                            Quantity = d.Quantity,
                            ActualQuantity = d.ActualQuantity ?? d.Quantity,
                            DamageQuantity = d.DamageQuantity ?? 0,
                            DamageReason = d.DamageReason,
                            Price = d.Price,
                            TotalAmount = d.Price * (d.ActualQuantity ?? d.Quantity),
                            SerialNumbers = serials ?? new List<string>()
                        };
                    }).ToList(),
                    Summary = new
                    {
                        TotalItems = receiving.ReceivingDetails.Count,
                        TotalQuantity = receiving.ReceivingDetails.Sum(d => d.Quantity),
                        TotalActualQuantity = receiving.ReceivingDetails.Sum(d => d.ActualQuantity ?? d.Quantity),
                        TotalDamageQuantity = receiving.ReceivingDetails.Sum(d => d.DamageQuantity ?? 0),
                        TotalAmount = totalAmount
                    },
                    PrintDate = DateTime.Now
                };

                return Ok(printData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy dữ liệu in phiếu nhập {ReceivingId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // THỐNG KÊ NHẬP THEO THỜI GIAN
        [HttpGet("report")]
        public async Task<IActionResult> GetReport([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            try
            {
                var query = _db.Receivings
                    .Include(r => r.User)
                    .Include(r => r.Partner)
                    .Include(r => r.ReceivingDetails)
                        .ThenInclude(d => d.Product)
                    .AsQueryable();

                // Filter theo thời gian
                if (fromDate.HasValue)
                {
                    query = query.Where(r => r.ReceivedDate >= fromDate.Value.Date);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(r => r.ReceivedDate <= toDate.Value.Date.AddDays(1).AddSeconds(-1));
                }

                var report = await query
                    .OrderBy(r => r.ReceivedDate)
                    .ThenBy(r => r.OrderCode)
                    .Select(r => new ReceivingReportDTO
                    {
                        ReceivingId = r.ReceivingId,
                        OrderCode = r.OrderCode,
                        ReceivedDate = r.ReceivedDate,
                        CreatedDate = r.CreatedDate,
                        PartnerName = r.Partner.PartnerName,
                        DeliveryCode = r.DeliveryCode,
                        Status = r.Status,
                        Note = r.Note,
                        UserName = r.User.FullName,
                        Details = r.ReceivingDetails.Select(d => new ReceivingReportDetailDTO
                        {
                            ProductName = d.Product.ProductName,
                            ProductCode = d.Product.ProductCode,
                            Quantity = d.Quantity,
                            ActualQuantity = d.ActualQuantity ?? d.Quantity,
                            DamageQuantity = d.DamageQuantity ?? 0,
                            DamageReason = d.DamageReason,
                            Unit = d.Unit,
                            Price = d.Price,
                            TotalAmount = (d.ActualQuantity ?? d.Quantity) * d.Price
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }
    }
}
