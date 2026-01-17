namespace WMS1.DTO
{
    public class InventorySummaryDTO
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int BeginningBalance { get; set; }
        public int TotalIN { get; set; }
        public int TotalOUT { get; set; }
        public int TotalAdjust { get; set; }
        public int EndingBalance { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}

