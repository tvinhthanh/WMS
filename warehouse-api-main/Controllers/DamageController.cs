using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WMS1.DTO;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DamageController : ControllerBase
    {
        private readonly WmsDbContext _db;
        private const int DAMAGE_RETURN_THRESHOLD = 20;

        public DamageController(WmsDbContext db)
        {
            _db = db;
        }

        /// <summary>
        /// Danh sách hàng hư đang chờ đạt ngưỡng để xuất trả (gom theo Product + Partner)
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var pending = await _db.PendingDamages
                .Include(p => p.Product)
                .Include(p => p.Partner)
                .Where(p => p.Status == "Pending")
                .ToListAsync();

            var data = pending
                .GroupBy(p => new { p.ProductId, p.Product.ProductName, p.PartnerId, p.Partner.PartnerName })
                .Select(g => new PendingDamageSummaryDTO
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    PartnerId = g.Key.PartnerId,
                    PartnerName = g.Key.PartnerName,
                    TotalPending = g.Sum(x => x.Quantity),
                    Threshold = DAMAGE_RETURN_THRESHOLD,
                    EarliestReceivedDate = g.Min(x => x.ReceivedDate),
                    LatestDamageDate = g.Max(x => x.DamageDate),
                    Items = g.Select(x => new PendingDamageItemDTO
                    {
                        PendingDamageId = x.PendingDamageId,
                        ProductId = x.ProductId,
                        ProductName = x.Product.ProductName,
                        PartnerId = x.PartnerId,
                        PartnerName = x.Partner.PartnerName,
                        Quantity = x.Quantity,
                        DamageReason = x.DamageReason,
                        DamageDate = x.DamageDate,
                        ReceivedDate = x.ReceivedDate,
                        SourceType = x.SourceType,
                        SourceId = x.SourceId,
                        Status = x.Status
                    }).ToList()
                })
                .OrderByDescending(x => x.TotalPending)
                .ThenBy(x => x.ProductName)
                .ToList();

            return Ok(data);
        }
    }
}

