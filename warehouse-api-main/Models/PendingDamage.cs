namespace WMS1.Models
{
    /// <summary>
    /// PendingDamage lưu tạm các lần ghi nhận hàng hư hỏng của nhà cung cấp.
    /// Khi đạt ngưỡng cấu hình (vd 20) sẽ tự động tạo phiếu xuất trả.
    /// </summary>
    public class PendingDamage
    {
        public int PendingDamageId { get; set; }
        public int ProductId { get; set; }
        public int PartnerId { get; set; }
        public int? ReceivingDetailId { get; set; }
        public int Quantity { get; set; }
        public string? DamageReason { get; set; }
        public DateTime DamageDate { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public string SourceType { get; set; } = "STOCKTAKE"; // STOCKTAKE / RECEIVING
        public int? SourceId { get; set; } // StockTakeId hoặc ReceivingId
        public string Status { get; set; } = "Pending"; // Pending, Queued
        public int? PickingOrderId { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation
        public virtual Product Product { get; set; }
        public virtual Partners Partner { get; set; }
        public virtual ReceivingDetail? ReceivingDetail { get; set; }
        public virtual PickingOrder? PickingOrder { get; set; }
    }
}

