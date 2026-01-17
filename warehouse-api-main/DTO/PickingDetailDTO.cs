namespace WMS1.DTO
{
    public class PickingDetailDTO
    {
        public int PickingDetailId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int QuantityPicked { get; set; }
        public decimal? UnitPrice { get; set; } // Giá đơn vị (tính theo tỷ lệ từ lô hàng)
        public string? SerialNumbers { get; set; } // Danh sách số series (comma-separated, giữ lại để tương thích)
        public List<SerialNumberInfo>? SerialNumberDetails { get; set; } // Danh sách serial numbers với ProductSeriesId
    }
}
