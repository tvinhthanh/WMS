namespace WMS1.DTO
{
    public class InventoryLogDTO
    {
        public int InventoryLogId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; }
        public int? InventoryDetailId { get; set; }
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } // 'IN', 'OUT', 'ADJUST'
        public int QuantityChange { get; set; }
        public int BalanceAfter { get; set; }
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
    }
}

