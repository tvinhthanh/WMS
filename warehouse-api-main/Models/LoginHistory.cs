namespace WMS1.Models
{
    public class LoginHistory
    {
        public int LoginHistoryId { get; set; }
        public int UserId { get; set; }
        public DateTime LoginTime { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        public virtual User User { get; set; }
    }
}
