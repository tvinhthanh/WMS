namespace WMS1.Models
{
    public class Product
    {
        public int ProductId { get; set; }
        public string ProductCode { get; set; }
        public string ProductName { get; set; }
        public int CategoryId { get; set; }
        public string Unit { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; } // URL hình ảnh sản phẩm
        public int? WarrantyPeriod { get; set; } // Thời gian bảo hành (số tháng)

        public virtual ProductCategory Category { get; set; }

        public virtual ICollection<ReceivingDetail> ReceivingDetails { get; set; } = new HashSet<ReceivingDetail>();
        public virtual ICollection<PickingDetail> PickingDetails { get; set; } = new HashSet<PickingDetail>();
        public virtual ICollection<InventoryDetail> InventoryDetails { get; set; } = new HashSet<InventoryDetail>();
        public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new HashSet<InventoryLog>();
        public virtual ICollection<StockTakeDetail> StockTakeDetails { get; set; } = new HashSet<StockTakeDetail>();
        public virtual ICollection<PendingDamage> PendingDamages { get; set; } = new HashSet<PendingDamage>();
    }
}
