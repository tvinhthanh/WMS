using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly WmsDbContext _db;

        public CategoryController(WmsDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _db.ProductCategories.ToListAsync());
        }

        [HttpPost]
        public async Task<IActionResult> Create(ProductCategory c)
        {
            _db.ProductCategories.Add(c);
            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ProductCategory dto)
        {
            var c = await _db.ProductCategories.FindAsync(id);
            if (c == null) return NotFound();

            c.CategoryName = dto.CategoryName;

            await _db.SaveChangesAsync();
            return Ok(c);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var used = await _db.Products.AnyAsync(p => p.CategoryId == id);

            if (used)
                return BadRequest("Không thể xóa danh mục vì đã có sản phẩm sử dụng");

            var c = await _db.ProductCategories.FindAsync(id);
            if (c == null) return NotFound();

            _db.ProductCategories.Remove(c);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa danh mục thành công" });
        }

    }
}
