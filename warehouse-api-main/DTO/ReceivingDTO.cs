using WMS1.Models;

public class ReceivingDTO
{
    public int ReceivingId { get; set; }
    public string OrderCode { get; set; }

    public int UserId { get; set; }
    public string UserName { get; set; }

    public int PartnerId { get; set; }
    public string PartnerName { get; set; }

    public string? DeliveryCode { get; set; }
    public DateTime ReceivedDate { get; set; }
    public DateTime CreatedDate { get; set; }

    public byte Status { get; set; }
    public string? Note { get; set; }

    public List<ReceivingDetailDTO> Details { get; set; }
}

// ✅ DTO cho thống kê nhập theo thời gian
public class ReceivingReportDTO
{
    public int ReceivingId { get; set; }
    public string OrderCode { get; set; }
    public DateTime ReceivedDate { get; set; }
    public DateTime CreatedDate { get; set; }
    public string PartnerName { get; set; }
    public string? DeliveryCode { get; set; }
    public byte Status { get; set; }
    public string? Note { get; set; }
    public string UserName { get; set; }
    public List<ReceivingReportDetailDTO> Details { get; set; }
}

public class ReceivingReportDetailDTO
{
    public string ProductName { get; set; }
    public string ProductCode { get; set; }
    public int Quantity { get; set; }
    public int ActualQuantity { get; set; }
    public int DamageQuantity { get; set; }
    public string? DamageReason { get; set; }
    public string? Unit { get; set; }
    public decimal Price { get; set; }
    public decimal TotalAmount { get; set; }
}