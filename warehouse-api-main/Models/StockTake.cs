namespace WMS1.Models
{
    /// <summary>
    /// StockTake - Phiếu kiểm kê kho
    /// </summary>
    public class StockTake
    {
        public int StockTakeId { get; set; }
        public string StockTakeCode { get; set; }
        public DateTime StockTakeDate { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Status { get; set; } // "Pending", "Completed", "Cancelled"
        public string? Note { get; set; }

        // Navigation properties
        public virtual User CreatedByUser { get; set; }
        public virtual ICollection<StockTakeDetail> StockTakeDetails { get; set; } = new HashSet<StockTakeDetail>();
    }

    /// <summary>
    /// StockTakeDetail - Chi tiết kiểm kê từng sản phẩm
    /// </summary>
    public class StockTakeDetail
    {
        public int StockTakeDetailId { get; set; }
        public int StockTakeId { get; set; }
        public int ProductId { get; set; }
        public int SystemQuantity { get; set; } // Số lượng theo hệ thống
        public int ActualQuantity { get; set; } // Số lượng thực tế còn tốt khi kiểm kê
        public int DamageQuantity { get; set; } // Số lượng hàng hư hỏng
        public string? DamageReason { get; set; } // Lý do hư hỏng
        public int Variance { get; set; } // Chênh lệch (Actual - System)
        public string? Note { get; set; }

        // Navigation properties
        public virtual StockTake StockTake { get; set; }
        public virtual Product Product { get; set; }
    }
}

