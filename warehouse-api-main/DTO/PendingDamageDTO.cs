namespace WMS1.DTO
{
    public class PendingDamageItemDTO
    {
        public int PendingDamageId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int PartnerId { get; set; }
        public string PartnerName { get; set; }
        public int Quantity { get; set; }
        public string? DamageReason { get; set; }
        public DateTime DamageDate { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public string SourceType { get; set; }
        public int? SourceId { get; set; }
        public string Status { get; set; }
    }

    public class PendingDamageSummaryDTO
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int PartnerId { get; set; }
        public string PartnerName { get; set; }
        public int TotalPending { get; set; }
        public int Threshold { get; set; }
        public DateTime? EarliestReceivedDate { get; set; }
        public DateTime? LatestDamageDate { get; set; }
        public List<PendingDamageItemDTO> Items { get; set; } = new();
    }
}

