namespace WMS1.Models
{
    public class PickingDetail
    {
        public int PickingDetailId { get; set; }
        public int PickingOrderId { get; set; }
        public int ProductId { get; set; }
        public int QuantityPicked { get; set; }
        public decimal? UnitPrice { get; set; } // Giá đơn vị cho đơn xuất này
        public string? SerialNumbers { get; set; } // Danh sách số series, phân cách bằng dấu phẩy

        public virtual PickingOrder PickingOrder { get; set; }
        public virtual Product Product { get; set; }
        public virtual ICollection<PickingSerialDetail> PickingSerialDetails { get; set; } = new HashSet<PickingSerialDetail>();
    }
}
