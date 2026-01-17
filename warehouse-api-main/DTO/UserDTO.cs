using System.ComponentModel.DataAnnotations;

namespace WMS1.DTO
{
    public class UserDTO
    {
        public int UserId { get; set; }

        public string? EmployeeCode { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }

        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Gender { get; set; }
        public DateTime? BirthDate { get; set; }
        public string? Position { get; set; }
        public decimal? Salary { get; set; }

        // PASSWORD
        public string? Password { get; set; }
        public string? ConfirmPassword { get; set; }

        public DateTime? CreatedDate { get; set; }
    }

    public class ForgotPassDTO
    {
        public string? EmployeeCode { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? NewPassword { get; set; }
        public string? ConfirmPassword { get; set; }
    }

    public class ChangePassDTO
    {
        public int UserId { get; set; }
        [Required(ErrorMessage = "Current password is required")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "New password is required")]
        [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password confirmation is required")]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
