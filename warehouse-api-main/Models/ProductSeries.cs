namespace WMS1.Models
{
    /// <summary>
    /// Quản lý số series cho từng sản phẩm
    /// Mỗi sản phẩm có thể có nhiều số series
    /// </summary>
    public class ProductSeries
    {
        public int ProductSeriesId { get; set; }
        public int ProductId { get; set; }
        public int? InventoryDetailId { get; set; } // Liên kết với lô hàng nhập
        public int? PickingDetailId { get; set; } // Liên kết với đơn xuất (nếu đã xuất)
        public string SerialNumber { get; set; } // Số series duy nhất
        public DateTime? ReceivedDate { get; set; } // Ngày nhập
        public DateTime? PickedDate { get; set; } // Ngày xuất
        public string Status { get; set; } = "InStock"; // InStock, Picked, Damaged, Lost
        public string? Notes { get; set; }

        // Navigation properties
        public virtual Product Product { get; set; }
        public virtual InventoryDetail? InventoryDetail { get; set; }
        public virtual PickingDetail? PickingDetail { get; set; }
    }
}

