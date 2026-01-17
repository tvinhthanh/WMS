namespace WMS1.Models
{
    public class ReceivingDetail
    {
        public int ReceivingDetailId { get; set; }
        public int ReceivingId { get; set; }
        public int ProductId { get; set; }

        public int Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal Price { get; set; }
        public int? ActualQuantity { get; set; }
        public int? DamageQuantity { get; set; } // Hàng hư hỏng ghi nhận khi nhập
        public string? DamageReason { get; set; } // Lý do hư hỏng (tùy chọn)

        public virtual Receiving Receiving { get; set; }
        public virtual Product Product { get; set; }
        public virtual ICollection<InventoryDetail> InventoryDetails { get; set; } = new HashSet<InventoryDetail>();
        public virtual ICollection<PendingDamage> PendingDamages { get; set; } = new HashSet<PendingDamage>();
    }
}
