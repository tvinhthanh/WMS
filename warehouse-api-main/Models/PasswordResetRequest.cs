namespace WMS1.Models
{
    /// <summary>
    /// Model để lưu các request reset password từ user
    /// Admin sẽ xem và xử lý các requests này
    /// </summary>
    public class PasswordResetRequest
    {
        public int PasswordResetRequestId { get; set; }
        public int? UserId { get; set; } // User ID nếu tìm thấy user
        public string LoginInfo { get; set; } = string.Empty; // Email, Username, hoặc EmployeeCode mà user cung cấp
        public string? UserFullName { get; set; } // Tên user nếu tìm thấy
        public string? UserEmployeeCode { get; set; } // Mã nhân viên nếu tìm thấy
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected
        public DateTime RequestDate { get; set; } = DateTime.Now;
        public DateTime? ProcessedDate { get; set; } // Ngày admin xử lý
        public int? ProcessedByUserId { get; set; } // Admin nào xử lý
        public string? Notes { get; set; } // Ghi chú từ admin

        // Navigation properties
        public virtual User? User { get; set; }
        public virtual User? ProcessedByUser { get; set; }
    }
}
