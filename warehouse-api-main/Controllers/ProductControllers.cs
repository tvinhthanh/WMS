using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.DTO;
using WMS1.Models;
using Microsoft.Extensions.Logging;
using System.Linq;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private readonly ILogger<ProductController> _logger;

        public ProductController(WmsDbContext db, ILogger<ProductController> logger)
        {
            _db = db;
            _logger = logger;
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            // ✅ Tối ưu: Thêm pagination để tránh load quá nhiều data
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 50; // Giới hạn tối đa 100 items/page

            var totalCount = await _db.Products.CountAsync();

            var data = await _db.Products
                .Include(p => p.Category)
                .AsNoTracking() // Read-only query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    ProductCode = p.ProductCode,
                    ProductName = p.ProductName,
                    Unit = p.Unit,
                    Description = p.Description,
                    CategoryId = p.CategoryId,
                    ImageUrl = p.ImageUrl,
                    WarrantyPeriod = p.WarrantyPeriod
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

        // GET BY PARTNER: Lấy danh sách sản phẩm được cung cấp bởi một nhà cung cấp
        [HttpGet("by-partner/{partnerId}")]
        public async Task<IActionResult> GetByPartner(int partnerId)
        {
            try
            {
                var data = await _db.ProductPartners
                    .Include(pp => pp.Product)
                        .ThenInclude(p => p.Category)
                    .Where(pp => pp.PartnerId == partnerId)
                    .AsNoTracking() // Read-only query
                    .Select(pp => new ProductDTO
                    {
                        ProductId = pp.Product.ProductId,
                        ProductCode = pp.Product.ProductCode,
                        ProductName = pp.Product.ProductName,
                        Unit = pp.Product.Unit,
                        Description = pp.Product.Description,
                        CategoryId = pp.Product.CategoryId,
                        ImageUrl = pp.Product.ImageUrl,
                        WarrantyPeriod = pp.Product.WarrantyPeriod
                    })
                    .ToListAsync();

                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting products by PartnerId: {PartnerId}", partnerId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var p = await _db.Products
                .Include(p => p.Category)
                .AsNoTracking() // Read-only query
                .Where(p => p.ProductId == id)
                .Select(p => new ProductDTO
                {
                    ProductId = p.ProductId,
                    ProductCode = p.ProductCode,
                    ProductName = p.ProductName,
                    Unit = p.Unit,
                    Description = p.Description,
                    CategoryId = p.CategoryId,
                    ImageUrl = p.ImageUrl,
                    WarrantyPeriod = p.WarrantyPeriod
                })
                .FirstOrDefaultAsync();

            if (p == null) return NotFound();

            return Ok(p);
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create(ProductDTO dto)
        {
            var p = new Product
            {
                ProductCode = dto.ProductCode,
                ProductName = dto.ProductName,
                Unit = dto.Unit,
                Description = dto.Description,
                CategoryId = dto.CategoryId,
                ImageUrl = dto.ImageUrl,
                WarrantyPeriod = dto.WarrantyPeriod
            };

            _db.Products.Add(p);
            await _db.SaveChangesAsync();

            dto.ProductId = p.ProductId;

            return Ok(dto);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ProductDTO dto)
        {
            var p = await _db.Products.FindAsync(id);
            if (p == null) return NotFound();

            p.ProductCode = dto.ProductCode;
            p.ProductName = dto.ProductName;
            p.Unit = dto.Unit;
            p.Description = dto.Description;
            p.CategoryId = dto.CategoryId;
            p.ImageUrl = dto.ImageUrl;
            p.WarrantyPeriod = dto.WarrantyPeriod;

            await _db.SaveChangesAsync();

            return Ok(dto);
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            // ✅ Tối ưu: Kiểm tra tất cả bảng trong một query duy nhất thay vì 5 queries riêng biệt
            var isUsed = await _db.ReceivingDetails.AnyAsync(x => x.ProductId == id) ||
                await _db.PickingDetails.AnyAsync(x => x.ProductId == id) ||
                await _db.InventoryDetails.AnyAsync(x => x.ProductId == id) ||
                await _db.StockTakeDetails.AnyAsync(x => x.ProductId == id) ||
                await _db.ProductSeries.AnyAsync(x => x.ProductId == id);

            if (isUsed)
                return BadRequest("Không thể xóa sản phẩm vì đã phát sinh giao dịch kho");

            var p = await _db.Products.FindAsync(id);
            if (p == null) return NotFound();

            _db.Products.Remove(p);
            await _db.SaveChangesAsync();

            return Ok();
        }




        // ============================================
        // QUẢN LÝ SỐ SERIES (ProductSeries)
        // ============================================

        // GET: Lấy tất cả số series của một sản phẩm
        // Chỉ hiển thị những serial numbers chưa có PickedDate (chưa xuất)
        [HttpGet("{id}/series")]
        public async Task<IActionResult> GetSeries(int id)
        {
            try
            {
                var series = await _db.ProductSeries
                    .Where(ps => ps.ProductId == id && ps.PickedDate == null) // Chỉ lấy những serial chưa xuất
                    .OrderByDescending(ps => ps.ReceivedDate)
                    .ThenBy(ps => ps.ProductSeriesId)
                    .Select(ps => new
                    {
                        ps.ProductSeriesId,
                        ps.SerialNumber,
                        ps.Status,
                        ps.ReceivedDate,
                        ps.PickedDate,
                        ps.Notes,
                        InventoryDetailId = ps.InventoryDetailId,
                        PickingDetailId = ps.PickingDetailId
                    })
                    .ToListAsync();

                return Ok(series);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting product series for ProductId: {ProductId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // POST: Thêm số series mới
        [HttpPost("{id}/series")]
        public async Task<IActionResult> AddSeries(int id, [FromBody] CreateProductSeriesDto dto)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(dto.SerialNumber))
                    return BadRequest("Số series không được để trống.");

                dto.SerialNumber = dto.SerialNumber.Trim();

                // Validate product exists
                var product = await _db.Products.FindAsync(id);
                if (product == null)
                    return NotFound("Không tìm thấy sản phẩm.");

                // Check duplicate
                var existing = await _db.ProductSeries
                    .FirstOrDefaultAsync(ps => ps.SerialNumber == dto.SerialNumber);

                if (existing != null)
                    return BadRequest($"Số series '{dto.SerialNumber}' đã tồn tại.");

                // Validate InventoryDetailId nếu có
                if (dto.InventoryDetailId.HasValue)
                {
                    var inventoryDetail = await _db.InventoryDetails.FindAsync(dto.InventoryDetailId.Value);
                    if (inventoryDetail == null)
                        return BadRequest($"Không tìm thấy lô hàng với ID: {dto.InventoryDetailId.Value}");
                }

                var series = new ProductSeries
                {
                    ProductId = id,
                    InventoryDetailId = dto.InventoryDetailId,
                    SerialNumber = dto.SerialNumber,
                    Status = dto.Status ?? "InStock",
                    ReceivedDate = dto.ReceivedDate ?? DateTime.Now,
                    Notes = dto.Notes
                };

                _db.ProductSeries.Add(series);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    series.ProductSeriesId,
                    series.SerialNumber,
                    series.Status,
                    message = "Thêm số series thành công."
                });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating product series for ProductId: {ProductId}. InnerException: {InnerException}", 
                    id, dbEx.InnerException?.Message ?? "No inner exception");
                
                // Lấy inner exception message chi tiết
                var errorMessage = dbEx.Message;
                var innerMessage = dbEx.InnerException?.Message ?? "";
                var fullError = $"{errorMessage} | Inner: {innerMessage}";
                
                // Kiểm tra các loại lỗi phổ biến
                if (innerMessage.Contains("IX_ProductSeries_SerialNumber") || 
                    innerMessage.Contains("UNIQUE KEY") ||
                    innerMessage.Contains("duplicate key") ||
                    innerMessage.Contains("Cannot insert duplicate key"))
                {
                    return BadRequest($"Số series '{dto.SerialNumber}' đã tồn tại trong hệ thống.");
                }
                
                if (innerMessage.Contains("FOREIGN KEY") || innerMessage.Contains("The INSERT statement conflicted with the FOREIGN KEY"))
                {
                    if (innerMessage.Contains("ProductId"))
                        return BadRequest("Sản phẩm không tồn tại hoặc không hợp lệ.");
                    if (innerMessage.Contains("InventoryDetailId"))
                        return BadRequest("Lô hàng không tồn tại hoặc không hợp lệ.");
                    return BadRequest("Lỗi ràng buộc dữ liệu. Vui lòng kiểm tra lại thông tin.");
                }
                
                if (innerMessage.Contains("NOT NULL") || innerMessage.Contains("Cannot insert the value NULL"))
                {
                    return BadRequest("Một số trường bắt buộc bị thiếu. Vui lòng kiểm tra lại dữ liệu.");
                }
                
                // Trả về lỗi chi tiết trong development, ẩn trong production
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                return StatusCode(500, isDevelopment 
                    ? $"Lỗi database: {fullError}" 
                    : "Lỗi khi lưu dữ liệu. Vui lòng thử lại hoặc liên hệ quản trị viên.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product series for ProductId: {ProductId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // POST: Thêm nhiều số series cùng lúc
        [HttpPost("{id}/series/bulk")]
        public async Task<IActionResult> AddSeriesBulk(int id, [FromBody] BulkCreateProductSeriesDto dto)
        {
            try
            {
                // Validate product exists
                var product = await _db.Products.FindAsync(id);
                if (product == null)
                    return NotFound("Không tìm thấy sản phẩm.");

                // Validate và làm sạch danh sách serial numbers
                if (dto.SerialNumbers == null || !dto.SerialNumbers.Any())
                    return BadRequest("Danh sách số series không được rỗng.");

                // Loại bỏ null, empty, và trim whitespace
                var cleanedSerials = dto.SerialNumbers
                    .Where(sn => !string.IsNullOrWhiteSpace(sn))
                    .Select(sn => sn.Trim())
                    .Distinct() // Loại bỏ duplicate trong cùng batch
                    .ToList();

                if (!cleanedSerials.Any())
                    return BadRequest("Không có số series hợp lệ nào.");

                // Validate InventoryDetailId nếu có
                if (dto.InventoryDetailId.HasValue)
                {
                    var inventoryDetail = await _db.InventoryDetails.FindAsync(dto.InventoryDetailId.Value);
                    if (inventoryDetail == null)
                        return BadRequest($"Không tìm thấy lô hàng với ID: {dto.InventoryDetailId.Value}");
                }

                // Kiểm tra các số series đã tồn tại trong database
                var existingSerials = await _db.ProductSeries
                    .Where(ps => cleanedSerials.Contains(ps.SerialNumber))
                    .Select(ps => ps.SerialNumber)
                    .ToListAsync();

                if (existingSerials.Any())
                    return BadRequest($"Các số series sau đã tồn tại: {string.Join(", ", existingSerials)}");

                // Tạo danh sách ProductSeries
                var receivedDate = dto.ReceivedDate ?? DateTime.Now;
                var seriesList = cleanedSerials
                    .Where(sn => !string.IsNullOrWhiteSpace(sn)) // Double check
                    .Select(sn => new ProductSeries
                    {
                        ProductId = id,
                        InventoryDetailId = dto.InventoryDetailId,
                        SerialNumber = sn.Trim(), // Đảm bảo trim
                        Status = "InStock",
                        ReceivedDate = receivedDate,
                        Notes = dto.Notes
                    })
                    .ToList();
                
                // Validate tất cả các record trước khi save
                foreach (var series in seriesList)
                {
                    if (string.IsNullOrWhiteSpace(series.SerialNumber))
                    {
                        return BadRequest("Không được có số series rỗng trong danh sách.");
                    }
                    if (series.ProductId <= 0)
                    {
                        return BadRequest("ProductId không hợp lệ.");
                    }
                }

                // Thêm vào database
                _db.ProductSeries.AddRange(seriesList);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    count = seriesList.Count,
                    message = $"Thêm {seriesList.Count} số series thành công."
                });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error creating bulk product series for ProductId: {ProductId}. InnerException: {InnerException}", 
                    id, dbEx.InnerException?.Message ?? "No inner exception");
                
                // Lấy inner exception message chi tiết
                var errorMessage = dbEx.Message;
                var innerMessage = dbEx.InnerException?.Message ?? "";
                var fullError = $"{errorMessage} | Inner: {innerMessage}";
                
                // Kiểm tra các loại lỗi phổ biến
                if (innerMessage.Contains("IX_ProductSeries_SerialNumber") || 
                    innerMessage.Contains("UNIQUE KEY") ||
                    innerMessage.Contains("duplicate key") ||
                    innerMessage.Contains("Cannot insert duplicate key"))
                {
                    return BadRequest("Một hoặc nhiều số series đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.");
                }
                
                if (innerMessage.Contains("FOREIGN KEY") || innerMessage.Contains("The INSERT statement conflicted with the FOREIGN KEY"))
                {
                    if (innerMessage.Contains("ProductId"))
                        return BadRequest("Sản phẩm không tồn tại hoặc không hợp lệ.");
                    if (innerMessage.Contains("InventoryDetailId"))
                        return BadRequest("Lô hàng không tồn tại hoặc không hợp lệ.");
                    return BadRequest("Lỗi ràng buộc dữ liệu. Vui lòng kiểm tra lại thông tin.");
                }
                
                if (innerMessage.Contains("NOT NULL") || innerMessage.Contains("Cannot insert the value NULL"))
                {
                    return BadRequest("Một số trường bắt buộc bị thiếu. Vui lòng kiểm tra lại dữ liệu.");
                }
                
                // Trả về lỗi chi tiết trong development, ẩn trong production
                var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
                return StatusCode(500, isDevelopment 
                    ? $"Lỗi database: {fullError}" 
                    : "Lỗi khi lưu dữ liệu. Vui lòng thử lại hoặc liên hệ quản trị viên.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bulk product series for ProductId: {ProductId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // PUT: Cập nhật số series
        [HttpPut("series/{seriesId}")]
        public async Task<IActionResult> UpdateSeries(int seriesId, [FromBody] UpdateProductSeriesDto dto)
        {
            try
            {
                var series = await _db.ProductSeries.FindAsync(seriesId);
                if (series == null)
                    return NotFound("Không tìm thấy số series.");

                if (!string.IsNullOrEmpty(dto.SerialNumber) && dto.SerialNumber != series.SerialNumber)
                {
                    var existing = await _db.ProductSeries
                        .FirstOrDefaultAsync(ps => ps.SerialNumber == dto.SerialNumber && ps.ProductSeriesId != seriesId);
                    if (existing != null)
                        return BadRequest($"Số series '{dto.SerialNumber}' đã tồn tại.");
                }

                if (!string.IsNullOrEmpty(dto.SerialNumber))
                    series.SerialNumber = dto.SerialNumber;
                if (!string.IsNullOrEmpty(dto.Status))
                    series.Status = dto.Status;
                if (dto.PickedDate.HasValue)
                    series.PickedDate = dto.PickedDate;
                if (dto.PickingDetailId.HasValue)
                    series.PickingDetailId = dto.PickingDetailId;
                if (dto.Notes != null)
                    series.Notes = dto.Notes;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    series.ProductSeriesId,
                    series.SerialNumber,
                    series.Status,
                    message = "Cập nhật số series thành công."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product series: {Id}", seriesId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // DELETE: Xóa số series
        [HttpDelete("series/{seriesId}")]
        public async Task<IActionResult> DeleteSeries(int seriesId)
        {
            try
            {
                var series = await _db.ProductSeries.FindAsync(seriesId);
                if (series == null)
                    return NotFound("Không tìm thấy số series.");

                _db.ProductSeries.Remove(series);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Xóa số series thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product series: {Id}", seriesId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // GET: Tìm số series
        [HttpGet("series/search/{serialNumber}")]
        public async Task<IActionResult> SearchSeries(string serialNumber)
        {
            try
            {
                var series = await _db.ProductSeries
                    .Include(ps => ps.Product)
                    .Where(ps => ps.SerialNumber.Contains(serialNumber))
                    .Select(ps => new
                    {
                        ps.ProductSeriesId,
                        ps.ProductId,
                        ProductName = ps.Product.ProductName,
                        ps.SerialNumber,
                        ps.Status,
                        ps.ReceivedDate,
                        ps.PickedDate
                    })
                    .ToListAsync();

                return Ok(series);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching product series: {SerialNumber}", serialNumber);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // ============================================
        // QUẢN LÝ NHÀ CUNG CẤP (ProductPartner)
        // ============================================

        // GET: Lấy nhà cung cấp của sản phẩm
        [HttpGet("{id}/partners")]
        public async Task<IActionResult> GetPartners(int id)
        {
            try
            {
                var data = await _db.ProductPartners
                    .Include(pp => pp.Partner)
                    .Where(pp => pp.ProductId == id)
                    .Select(pp => new
                    {
                        pp.ProductPartnerId,
                        pp.PartnerId,
                        PartnerName = pp.Partner.PartnerName,
                        PartnerType = pp.Partner.PartnerType,
                        pp.DefaultPrice,
                        pp.PartnerProductCode,
                        pp.CreatedDate
                    })
                    .ToListAsync();

                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting partners by ProductId: {ProductId}", id);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // POST: Thêm nhà cung cấp cho sản phẩm
        [HttpPost("{id}/partners")]
        public async Task<IActionResult> AddPartner(int id, [FromBody] CreateProductPartnerDto dto)
        {
            try
            {
                dto.ProductId = id;

                var product = await _db.Products.FindAsync(id);
                if (product == null)
                    return NotFound("Không tìm thấy sản phẩm.");

                var partner = await _db.Partners.FindAsync(dto.PartnerId);
                if (partner == null)
                    return NotFound("Không tìm thấy nhà cung cấp.");

                var existing = await _db.ProductPartners
                    .FirstOrDefaultAsync(pp => pp.ProductId == id && pp.PartnerId == dto.PartnerId);

                if (existing != null)
                    return BadRequest("Quan hệ sản phẩm - nhà cung cấp này đã tồn tại.");

                var productPartner = new ProductPartner
                {
                    ProductId = id,
                    PartnerId = dto.PartnerId,
                    DefaultPrice = dto.DefaultPrice,
                    PartnerProductCode = dto.PartnerProductCode,
                    CreatedDate = DateTime.Now
                };

                _db.ProductPartners.Add(productPartner);
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    productPartner.ProductPartnerId,
                    message = "Thêm nhà cung cấp cho sản phẩm thành công."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product partner");
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // PUT: Cập nhật quan hệ nhà cung cấp
        [HttpPut("partners/{partnerRelationId}")]
        public async Task<IActionResult> UpdatePartner(int partnerRelationId, [FromBody] UpdateProductPartnerDto dto)
        {
            try
            {
                var productPartner = await _db.ProductPartners.FindAsync(partnerRelationId);
                if (productPartner == null)
                    return NotFound("Không tìm thấy quan hệ sản phẩm - nhà cung cấp.");

                if (dto.DefaultPrice.HasValue)
                    productPartner.DefaultPrice = dto.DefaultPrice;
                if (dto.PartnerProductCode != null)
                    productPartner.PartnerProductCode = dto.PartnerProductCode;

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    productPartner.ProductPartnerId,
                    message = "Cập nhật quan hệ sản phẩm - nhà cung cấp thành công."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product partner: {Id}", partnerRelationId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // DELETE: Xóa quan hệ nhà cung cấp
        [HttpDelete("partners/{partnerRelationId}")]
        public async Task<IActionResult> DeletePartner(int partnerRelationId)
        {
            try
            {
                var productPartner = await _db.ProductPartners.FindAsync(partnerRelationId);
                if (productPartner == null)
                    return NotFound("Không tìm thấy quan hệ sản phẩm - nhà cung cấp.");

                _db.ProductPartners.Remove(productPartner);
                await _db.SaveChangesAsync();

                return Ok(new { message = "Xóa quan hệ sản phẩm - nhà cung cấp thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product partner: {Id}", partnerRelationId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }
    }

    // DTOs cho ProductSeries
    public class CreateProductSeriesDto
    {
        public int ProductId { get; set; }
        public int? InventoryDetailId { get; set; }
        public string SerialNumber { get; set; } = string.Empty;
        public string? Status { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public string? Notes { get; set; }
    }

    public class BulkCreateProductSeriesDto
    {
        public int ProductId { get; set; }
        public int? InventoryDetailId { get; set; }
        public List<string> SerialNumbers { get; set; } = new();
        public DateTime? ReceivedDate { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateProductSeriesDto
    {
        public string? SerialNumber { get; set; }
        public string? Status { get; set; }
        public DateTime? PickedDate { get; set; }
        public int? PickingDetailId { get; set; }
        public string? Notes { get; set; }
    }

    // DTOs cho ProductPartner
    public class CreateProductPartnerDto
    {
        public int ProductId { get; set; }
        public int PartnerId { get; set; }
        public decimal? DefaultPrice { get; set; }
        public string? PartnerProductCode { get; set; }
    }

    public class UpdateProductPartnerDto
    {
        public decimal? DefaultPrice { get; set; }
        public string? PartnerProductCode { get; set; }
    }
}
