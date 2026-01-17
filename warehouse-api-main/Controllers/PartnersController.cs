using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PartnersController : Controller
    {
        private readonly WmsDbContext _db;

        public PartnersController(WmsDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var partners = await _db.Partners
                .OrderByDescending(p => p.PartnerId)
                .ToListAsync();

            return Ok(partners);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var partner = await _db.Partners.FindAsync(id);

            if (partner == null)
                return NotFound("Không tìm thấy đối tác.");

            return Ok(partner);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Từ khóa không hợp lệ.");

            var results = await _db.Partners
                .Where(p => p.PartnerName.Contains(keyword))
                .ToListAsync();

            return Ok(results);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Partners dto)
        {
            if (string.IsNullOrWhiteSpace(dto.PartnerName))
                return BadRequest("Tên đối tác không được để trống.");

            // Check trùng tên
            bool exist = await _db.Partners
                .AnyAsync(p => p.PartnerName == dto.PartnerName);

            if (exist)
                return BadRequest("Tên đối tác đã tồn tại.");

            var partner = new Partners
            {
                PartnerName = dto.PartnerName,
                Address = dto.Address,
                PartnerType = dto.PartnerType,
                PhoneNumber = dto.PhoneNumber,
                Representative = dto.Representative,
                CreatedDate = DateTime.UtcNow
            };

            _db.Partners.Add(partner);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo đối tác thành công.",
                partnerId = partner.PartnerId
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Partners dto)
        {
            var partner = await _db.Partners.FindAsync(id);

            if (partner == null)
                return NotFound("Không tìm thấy đối tác.");

            // Check trùng tên khi update
            bool duplicate = await _db.Partners
                .AnyAsync(p => p.PartnerName == dto.PartnerName && p.PartnerId != id);

            if (duplicate)
                return BadRequest("Tên đối tác đã tồn tại.");

            partner.PartnerName = dto.PartnerName;
            partner.Address = dto.Address;
            partner.PartnerType = dto.PartnerType;
            partner.PhoneNumber = dto.PhoneNumber;
            partner.Representative = dto.Representative;

            await _db.SaveChangesAsync();

            return Ok("Cập nhật đối tác thành công.");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var partner = await _db.Partners
                .Include(p => p.Receivings)
                .Include(p => p.PickingOrders)
                .FirstOrDefaultAsync(p => p.PartnerId == id);

            if (partner == null)
                return NotFound("Không tìm thấy đối tác.");

            if (partner.Receivings.Any() || partner.PickingOrders.Any())
                return BadRequest("Không thể xóa đối tác vì đã phát sinh giao dịch.");

            _db.Partners.Remove(partner);
            await _db.SaveChangesAsync();

            return Ok("Xóa đối tác thành công.");
        }
    }
}
