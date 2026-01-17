using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileUploadController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<FileUploadController> _logger;
        private const string UploadFolder = "uploads";
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

        public FileUploadController(WmsDbContext db, IWebHostEnvironment env, ILogger<FileUploadController> logger)
        {
            _db = db;
            _env = env;
            _logger = logger;
        }

        // Upload hình ảnh sản phẩm
        [HttpPost("product/{productId}")]
        public async Task<IActionResult> UploadProductImage(int productId, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("Không có file được tải lên.");

                if (file.Length > MaxFileSize)
                    return BadRequest("File quá lớn. Kích thước tối đa là 5MB.");

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest("Định dạng file không hợp lệ. Chỉ chấp nhận: jpg, jpeg, png, gif, webp");

                var product = await _db.Products.FindAsync(productId);
                if (product == null)
                    return NotFound("Không tìm thấy sản phẩm.");

                // Tạo thư mục nếu chưa có
                var uploadPath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, UploadFolder, "products");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                // Tạo tên file unique
                var fileName = $"product_{productId}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadPath, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Lưu URL vào database
                var imageUrl = $"/{UploadFolder}/products/{fileName}";
                product.ImageUrl = imageUrl;
                await _db.SaveChangesAsync();

                return Ok(new { imageUrl, message = "Upload hình ảnh sản phẩm thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading product image for ProductId: {ProductId}", productId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // Upload hình ảnh phiếu nhập
        [HttpPost("receiving/{receivingId}")]
        public async Task<IActionResult> UploadReceivingImage(int receivingId, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("Không có file được tải lên.");

                if (file.Length > MaxFileSize)
                    return BadRequest("File quá lớn. Kích thước tối đa là 5MB.");

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                    return BadRequest("Định dạng file không hợp lệ. Chỉ chấp nhận: jpg, jpeg, png, gif, webp");

                var receiving = await _db.Receivings.FindAsync(receivingId);
                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                // Tạo thư mục nếu chưa có
                var uploadPath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, UploadFolder, "receivings");
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                // Tạo tên file unique
                var fileName = $"receiving_{receivingId}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
                var filePath = Path.Combine(uploadPath, fileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Lưu URL vào database
                var imageUrl = $"/{UploadFolder}/receivings/{fileName}";
                receiving.ImageUrl = imageUrl;
                await _db.SaveChangesAsync();

                return Ok(new { imageUrl, message = "Upload hình ảnh phiếu nhập thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading receiving image for ReceivingId: {ReceivingId}", receivingId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // Xóa hình ảnh sản phẩm
        [HttpDelete("product/{productId}")]
        public async Task<IActionResult> DeleteProductImage(int productId)
        {
            try
            {
                var product = await _db.Products.FindAsync(productId);
                if (product == null)
                    return NotFound("Không tìm thấy sản phẩm.");

                if (string.IsNullOrEmpty(product.ImageUrl))
                    return BadRequest("Sản phẩm không có hình ảnh.");

                // Xóa file
                var filePath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, product.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Xóa URL trong database
                product.ImageUrl = null;
                await _db.SaveChangesAsync();

                return Ok(new { message = "Xóa hình ảnh sản phẩm thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product image for ProductId: {ProductId}", productId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }

        // Xóa hình ảnh phiếu nhập
        [HttpDelete("receiving/{receivingId}")]
        public async Task<IActionResult> DeleteReceivingImage(int receivingId)
        {
            try
            {
                var receiving = await _db.Receivings.FindAsync(receivingId);
                if (receiving == null)
                    return NotFound("Không tìm thấy phiếu nhập.");

                if (string.IsNullOrEmpty(receiving.ImageUrl))
                    return BadRequest("Phiếu nhập không có hình ảnh.");

                // Xóa file
                var filePath = Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, receiving.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Xóa URL trong database
                receiving.ImageUrl = null;
                await _db.SaveChangesAsync();

                return Ok(new { message = "Xóa hình ảnh phiếu nhập thành công." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting receiving image for ReceivingId: {ReceivingId}", receivingId);
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }
    }
}
