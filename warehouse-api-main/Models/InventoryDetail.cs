namespace WMS1.Models
{
    /// <summary>
    /// InventoryDetail - FIFO lots tracking
    /// Each receiving detail creates a new lot
    /// Mỗi lần nhập hàng sẽ tạo ra một lot mới
    /// </summary>
    public class InventoryDetail
    {
        public int InventoryDetailId { get; set; }
        public int ProductId { get; set; }
        public int? ReceivingDetailId { get; set; } // Nullable để cho phép adjustment không có receiving
        public int QuantityIn { get; set; }
        public int QuantityRemaining { get; set; }
        public int? QuantityDamaged { get; set; } // Số lượng bị lỗi
        public int? QuantityLost { get; set; } // Số lượng bị mất
        public string? Unit { get; set; }
        public decimal Price { get; set; }
        public DateTime ReceivedDate { get; set; }

        // Navigation properties
        public virtual Product Product { get; set; }
        public virtual ReceivingDetail? ReceivingDetail { get; set; }
        public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new HashSet<InventoryLog>();
        public virtual ICollection<ProductSeries> ProductSeries { get; set; } = new HashSet<ProductSeries>();
    }
}

