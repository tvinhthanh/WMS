public class ReceivingCreateDTO
{
    public int UserId { get; set; }
    public int PartnerId { get; set; }
    public string? DeliveryCode { get; set; }
    public string? Note { get; set; }

    public List<ReceivingCreateDetailDTO> Details { get; set; }
}

public class ReceivingCreateDetailDTO
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; }
    public decimal Price { get; set; }
    public int? DamageQuantity { get; set; } // Nếu biết hàng hư tại lúc nhập (tùy chọn)
    public string? DamageReason { get; set; }
}

//  DTO cho cập nhật mã phiếu giao hàng
public class UpdateDeliveryCodeDTO
{
    public string? DeliveryCode { get; set; }
}
