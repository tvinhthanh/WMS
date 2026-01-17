using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WMS1.DTO;
using WMS1.Models;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly WmsDbContext _context;

        public UserController(WmsDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CREATE USER
        // =========================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserDTO dto)
        {
            int count = await _context.Users.CountAsync() + 1;

            string generatedEmployeeCode = $"NV{count:D3}";
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword("123456");

            var user = new User
            {
                EmployeeCode = generatedEmployeeCode,
                UserName = dto.Email,
                Email = dto.Email,
                PasswordHash = hashedPassword,
                Role = dto.Role ?? "Staff",
                CreatedDate = DateTime.Now,

                FullName = dto.FullName!,
                Phone = dto.Phone,
                Address = dto.Address,
                Gender = dto.Gender,
                BirthDate = dto.BirthDate,
                Position = dto.Position,
                Salary = dto.Salary
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(Map(user));
        }

        // =========================================================
        // GET ALL USERS
        // =========================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .Select(u => Map(u))
                .ToListAsync();

            return Ok(users);
        }

        // =========================================================
        // GET ONE USER
        // =========================================================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            return Ok(Map(user));
        }

        // =========================================================
        // UPDATE USER INFO (KHÔNG ĐỔI PASSWORD Ở ĐÂY)
        // =========================================================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserDTO dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Email = dto.Email ?? user.Email;
            user.Role = dto.Role ?? user.Role;

            user.FullName = dto.FullName ?? user.FullName;
            user.Phone = dto.Phone ?? user.Phone;
            user.Address = dto.Address ?? user.Address;
            user.Gender = dto.Gender ?? user.Gender;
            user.BirthDate = dto.BirthDate ?? user.BirthDate;
            user.Position = dto.Position ?? user.Position;
            user.Salary = dto.Salary ?? user.Salary;

            await _context.SaveChangesAsync();
            return Ok(Map(user));
        }

        // =========================================================
        // CHANGE PASSWORD
        // =========================================================
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePassDTO dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null) return NotFound();

            if (string.IsNullOrEmpty(dto.Password) ||
                string.IsNullOrEmpty(dto.NewPassword) ||
                string.IsNullOrEmpty(dto.ConfirmPassword))
            {
                return BadRequest("Thiếu thông tin mật khẩu.");
            }

            if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return BadRequest("Sai mật khẩu hiện tại.");

            if (dto.NewPassword != dto.ConfirmPassword)
                return BadRequest("Xác nhận mật khẩu không khớp.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return Ok("Đổi mật khẩu thành công.");
        }

        // =========================================================
        // RESET PASSWORD
        // =========================================================
        [HttpPost("reset-password/{id}")]
        public async Task<IActionResult> ResetPassword(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            string defaultPassword = "123456";
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

            await _context.SaveChangesAsync();

            return Ok($"Đã reset mật khẩu nhân viên {user.EmployeeCode} về mặc định: 123456");
        }

        // =========================================================
        // MAPPING
        // =========================================================
        private static UserDTO Map(User u)
        {
            return new UserDTO
            {
                UserId = u.UserId,
                EmployeeCode = u.EmployeeCode,
                UserName = u.UserName,
                Email = u.Email,
                Role = u.Role,
                CreatedDate = u.CreatedDate,

                FullName = u.FullName,
                Phone = u.Phone,
                Address = u.Address,
                Gender = u.Gender,
                BirthDate = u.BirthDate,
                Position = u.Position,
                Salary = u.Salary
            };
        }
        // =========================================================
        // LOGIN HISTORY(AD ONLY)
        // =========================================================
        [Authorize(Roles = "Admin")]
        [HttpGet("users/{userId}/login-history")]
        public async Task<IActionResult> GetUserLoginHistory(int userId)
        {
            var logs = await _context.LoginHistories
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.LoginTime)
                .Take(30)
                .Select(x => new
                {
                    x.LoginTime,
                    x.IpAddress,
                    x.UserAgent
                })
                .ToListAsync();

            return Ok(logs);
        }

        // =========================================================
        // PASSWORD RESET REQUESTS (Admin only)
        // =========================================================
        
        /// <summary>
        /// Lấy danh sách tất cả password reset requests (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("password-reset-requests")]
        public async Task<IActionResult> GetPasswordResetRequests([FromQuery] string? status = null)
        {
            var query = _context.PasswordResetRequests
                .Include(r => r.User)
                .Include(r => r.ProcessedByUser)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status == status);
            }

            var requests = await query
                .OrderByDescending(r => r.RequestDate)
                .Select(r => new PasswordResetRequestDTO
                {
                    PasswordResetRequestId = r.PasswordResetRequestId,
                    UserId = r.UserId,
                    LoginInfo = r.LoginInfo,
                    UserFullName = r.UserFullName,
                    UserEmployeeCode = r.UserEmployeeCode,
                    Status = r.Status,
                    RequestDate = r.RequestDate,
                    ProcessedDate = r.ProcessedDate,
                    ProcessedByUserId = r.ProcessedByUserId,
                    ProcessedByUserName = r.ProcessedByUser != null ? r.ProcessedByUser.FullName : null,
                    Notes = r.Notes
                })
                .ToListAsync();

            return Ok(requests);
        }

        /// <summary>
        /// Admin xử lý password reset request (Approve hoặc Reject)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("password-reset-requests/{requestId}/process")]
        public async Task<IActionResult> ProcessPasswordResetRequest(int requestId, [FromBody] ProcessPasswordResetRequestDTO dto)
        {
            var request = await _context.PasswordResetRequests
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.PasswordResetRequestId == requestId);

            if (request == null)
                return NotFound("Không tìm thấy yêu cầu reset mật khẩu");

            if (request.Status != "Pending")
                return BadRequest($"Yêu cầu này đã được xử lý (Status: {request.Status})");

            int adminId = GetUserId();

            if (dto.Action.ToLower() == "approve")
            {
                // Kiểm tra user có tồn tại không
                if (request.UserId == null || request.User == null)
                {
                    return BadRequest("Không tìm thấy user với thông tin đăng nhập này. Không thể reset mật khẩu.");
                }

                // Reset password về mặc định
                string defaultPassword = "123456";
                request.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(defaultPassword);

                request.Status = "Approved";
                request.ProcessedDate = DateTime.Now;
                request.ProcessedByUserId = adminId;
                request.Notes = dto.Notes;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Đã reset mật khẩu của nhân viên {request.User.EmployeeCode} ({request.User.FullName}) về mặc định: 123456",
                    userId = request.UserId,
                    employeeCode = request.User.EmployeeCode,
                    fullName = request.User.FullName
                });
            }
            else if (dto.Action.ToLower() == "reject")
            {
                request.Status = "Rejected";
                request.ProcessedDate = DateTime.Now;
                request.ProcessedByUserId = adminId;
                request.Notes = dto.Notes;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Đã từ chối yêu cầu reset mật khẩu"
                });
            }
            else
            {
                return BadRequest("Action phải là 'approve' hoặc 'reject'");
            }
        }

        // =========================================================
        // HELPERS
        // =========================================================
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("Không tìm thấy thông tin user");
            }
            return userId;
        }
    }
}
