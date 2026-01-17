namespace WMS1.Models
{
    public class PickingOrder
    {
        public int PickingOrderId { get; set; }
        public string OrderCode { get; set; }
        public int CreateByUserId { get; set; }
        public DateTime CreateDate { get; set; }
        public string Status { get; set; }
        public int PartnerId { get; set; }
        public virtual Partners Partner { get; set; }
        public virtual User CreateByUser { get; set; }
        public virtual ICollection<PickingDetail> PickingDetails { get; set; } = new HashSet<PickingDetail>();
        public virtual ICollection<PendingDamage> PendingDamages { get; set; } = new HashSet<PendingDamage>();
    }
}
