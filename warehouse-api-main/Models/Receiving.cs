namespace WMS1.Models
{
    public class Receiving
    {
        public int ReceivingId { get; set; }
        public string OrderCode { get; set; }
        public int UserId { get; set; }
        public DateTime ReceivedDate { get; set; }
        public string? Note { get; set; }
        public byte Status { get; set; } // 0 = tạm, 1 = chốt

        public virtual User User { get; set; }
        public virtual ICollection<ReceivingDetail> ReceivingDetails { get; set; } = new HashSet<ReceivingDetail>();

        // them theo yeu cau 
        public int PartnerId { get; set; }
        public virtual Partners Partner { get; set; }
        public string? DeliveryCode { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.Now;
        public string? ImageUrl { get; set; } // URL hình ảnh phiếu nhập
    }
}
