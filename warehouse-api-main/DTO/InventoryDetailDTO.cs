namespace WMS1.DTO
{
    public class InventoryDetailDTO
    {
        public int InventoryDetailId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int? ReceivingDetailId { get; set; } // Nullable vì adjustment không có receiving
        public int QuantityIn { get; set; }
        public int QuantityRemaining { get; set; }
        public string? Unit { get; set; }
        public decimal Price { get; set; }
        public DateTime ReceivedDate { get; set; }
        public int? PartnerId { get; set; }       
        public string? PartnerName { get; set; }
        public List<SerialNumberInfo>? SerialNumbers { get; set; } // Danh sách serial numbers với ProductSeriesId
    }

    public class SerialNumberInfo
    {
        public int ProductSeriesId { get; set; }
        public string SerialNumber { get; set; }
        public string Status { get; set; }
        public DateTime? PickedDate { get; set; } // Ngày xuất
    }
}

