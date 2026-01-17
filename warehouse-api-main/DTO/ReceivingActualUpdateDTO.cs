namespace WMS1.DTO
{
    public class ReceivingActualUpdateDTO
    {
        public int ReceivingId { get; set; }
        public List<ReceivingActualItemDTO> Items { get; set; }
    }

    public class ReceivingActualItemDTO
    {
        public int ReceivingDetailId { get; set; }
        public int ActualQuantity { get; set; }
        public int DamageQuantity { get; set; }
        public string? DamageReason { get; set; }
    }
}
