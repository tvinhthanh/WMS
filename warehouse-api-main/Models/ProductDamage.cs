namespace WMS1.Models
{
    /// <summary>
    /// Quản lý chi tiết từng sản phẩm bị hỏng và mất
    /// </summary>
    public class ProductDamage
    {
        public int ProductDamageId { get; set; }
        public int ProductId { get; set; }
        public int? InventoryDetailId { get; set; } // Lô hàng bị ảnh hưởng
        public int? ReceivingDetailId { get; set; } // Phiếu nhập (nếu phát hiện khi nhập)
        public int? StockTakeDetailId { get; set; } // Phiếu kiểm kê (nếu phát hiện khi kiểm kê)
        public string? SerialNumber { get; set; } // Số series nếu có
        public string DamageType { get; set; } // "Damaged" hoặc "Lost"
        public string? Reason { get; set; } // Lý do
        public DateTime DamageDate { get; set; } // Ngày phát hiện
        public int? ReportedByUserId { get; set; } // Người báo cáo
        public string? Notes { get; set; } // Ghi chú thêm

        // Navigation properties
        public virtual Product Product { get; set; }
        public virtual InventoryDetail? InventoryDetail { get; set; }
        public virtual ReceivingDetail? ReceivingDetail { get; set; }
        public virtual StockTakeDetail? StockTakeDetail { get; set; }
        public virtual User? ReportedByUser { get; set; }
    }
}

