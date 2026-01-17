namespace WMS1.Models
{
    /// <summary>
    /// Bảng trung gian quản lý sản phẩm cho từng nhà cung cấp
    /// Một sản phẩm có thể được cung cấp bởi nhiều nhà cung cấp
    /// Một nhà cung cấp có thể cung cấp nhiều sản phẩm
    /// </summary>
    public class ProductPartner
    {
        public int ProductPartnerId { get; set; }
        public int ProductId { get; set; }
        public int PartnerId { get; set; }
        public decimal? DefaultPrice { get; set; } // Giá mặc định từ nhà cung cấp này
        public string? PartnerProductCode { get; set; } // Mã sản phẩm của nhà cung cấp
        public DateTime CreatedDate { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual Product Product { get; set; }
        public virtual Partners Partner { get; set; }
    }
}

