namespace WMS1.Models
{
    public class Partners
    {
        public int PartnerId { get; set; }
        public string PartnerName { get; set; } = String.Empty;
        public string Address { get; set; } = String.Empty;
        public string PartnerType { get; set; } = String.Empty;
        public string PhoneNumber { get; set; } = String.Empty;
        public string Representative { get; set; } = String.Empty;
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public virtual ICollection<Receiving> Receivings { get; set; } = new HashSet<Receiving>();
        public virtual ICollection<PickingOrder> PickingOrders { get; set; } = new HashSet<PickingOrder>();
        public virtual ICollection<PendingDamage> PendingDamages { get; set; } = new HashSet<PendingDamage>();
    }
}
