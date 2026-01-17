public class ReceivingDetailDTO
{
    public int ReceivingDetailId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public string Unit { get; set; }
    public int Quantity { get; set; }
    public int? ActualQuantity { get; set; }
    public int? DamageQuantity { get; set; }
    public string? DamageReason { get; set; }
    public decimal Price { get; set; }
    public List<string>? SerialNumbers { get; set; } // Danh sách số series của lô hàng
}
