namespace WMS1.DTO
{
    public class PasswordResetRequestDTO
    {
        public int PasswordResetRequestId { get; set; }
        public int? UserId { get; set; }
        public string LoginInfo { get; set; } = string.Empty;
        public string? UserFullName { get; set; }
        public string? UserEmployeeCode { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime RequestDate { get; set; }
        public DateTime? ProcessedDate { get; set; }
        public int? ProcessedByUserId { get; set; }
        public string? ProcessedByUserName { get; set; }
        public string? Notes { get; set; }
    }

    public class CreatePasswordResetRequestDTO
    {
        public string LoginInfo { get; set; } = string.Empty; // Email, Username, hoặc EmployeeCode
    }

    public class ProcessPasswordResetRequestDTO
    {
        public string Action { get; set; } = string.Empty; // "approve" hoặc "reject"
        public string? Notes { get; set; }
    }
}
