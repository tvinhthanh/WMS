public class ProductDTO
{
    public int ProductId { get; set; }
    public string ProductCode { get; set; }
    public string ProductName { get; set; }
    public int CategoryId { get; set; }

    public string? Unit { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public int? WarrantyPeriod { get; set; }

}
