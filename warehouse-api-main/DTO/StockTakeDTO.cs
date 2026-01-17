namespace WMS1.DTO
{
    public class StockTakeDTO
    {
        public int StockTakeId { get; set; }
        public string StockTakeCode { get; set; }
        public DateTime StockTakeDate { get; set; }
        public int CreatedByUserId { get; set; }
        public string CreatedByUserName { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Status { get; set; }
        public string? Note { get; set; }
        public List<StockTakeDetailDTO> Details { get; set; } = new List<StockTakeDetailDTO>();
    }

    public class StockTakeDetailDTO
    {
        public int StockTakeDetailId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public string ProductCode { get; set; }
        public int SystemQuantity { get; set; }
        public int ActualQuantity { get; set; }
        public int DamageQuantity { get; set; }
        public string? DamageReason { get; set; }
        public int Variance { get; set; }
        public string? Note { get; set; }
        public List<SerialNumberInfo>? SerialNumbers { get; set; } // Danh sách serial numbers với ProductSeriesId
    }

    public class StockTakeCreateDTO
    {
        public int CreatedByUserId { get; set; }
        public DateTime StockTakeDate { get; set; }
        public string? Note { get; set; }
        public List<StockTakeDetailCreateDTO> Details { get; set; } = new List<StockTakeDetailCreateDTO>();
    }

    public class StockTakeDetailCreateDTO
    {
        public int ProductId { get; set; }
        public int ActualQuantity { get; set; }
        public int DamageQuantity { get; set; } // Số lượng hàng hư hỏng
        public string? DamageReason { get; set; } // Lý do hư hỏng
        public string? Note { get; set; }
    }

    public class StockTakeReviewDTO
    {
        // Có thể thêm các trường khác nếu cần (ví dụ: admin note)
        public string? AdminNote { get; set; }
    }
}

