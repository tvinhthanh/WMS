namespace WMS1.Models
{
    /// <summary>
    /// InventoryLog - Full movement history
    /// Tracks all IN, OUT, and ADJUST transactions
    /// </summary>
    public class InventoryLog
    {
        public int InventoryLogId { get; set; }
        public int ProductId { get; set; }
        public int? InventoryDetailId { get; set; } // NULL for adjustments
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } // 'IN', 'OUT', 'ADJUST', 'DAMAGE'
        public int QuantityChange { get; set; } // Positive for IN, Negative for OUT
        public int BalanceAfter { get; set; } // Inventory balance after this transaction
        public int? ReferenceId { get; set; } // ReceivingId, PickingOrderId, etc.
        public string? ReferenceType { get; set; } // 'RECEIVING', 'PICKING', 'STOCKTAKE'
        public int? UserId { get; set; }

        // Navigation properties
        public virtual Product Product { get; set; }
        public virtual InventoryDetail? InventoryDetail { get; set; }
        public virtual User? User { get; set; }
    }
}

