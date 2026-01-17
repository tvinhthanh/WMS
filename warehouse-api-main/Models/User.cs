namespace WMS1.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string EmployeeCode { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
        public string Role { get; set; }
        public DateTime CreatedDate { get; set; }

        public string FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Gender { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Position { get; set; }
        public decimal? Salary { get; set; }

        public virtual ICollection<LoginHistory> LoginHistories { get; set; } = new HashSet<LoginHistory>();
        public virtual ICollection<Receiving> Receivings { get; set; } = new HashSet<Receiving>();
        public virtual ICollection<PickingOrder> PickingOrders { get; set; } = new HashSet<PickingOrder>();
        public virtual ICollection<InventoryLog> InventoryLogs { get; set; } = new HashSet<InventoryLog>();
        public virtual ICollection<StockTake> StockTakes { get; set; } = new HashSet<StockTake>();
    }
}
