using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WMS1.DTO;
using WMS1.Models;
using BCrypt.Net;

namespace WMS1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly WmsDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(WmsDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

       
        // REGISTER
        
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserDTO dto)
        {
            if (dto.Password == null)
                return BadRequest("Password is required");

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return Conflict("Email already exists!");

            // Tự sinh mã NV
            int count = await _context.Users.CountAsync() + 1;
            string empCode = $"NV{count:D3}";

            var user = new User
            {
                EmployeeCode = empCode,
                UserName = dto.Email,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
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

            return Ok(new
            {
                Token = GenerateJwtToken(user),
                User = Map(user)
            });
        }

      
        // LOGIN
        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserDTO dto)
        {
            if (string.IsNullOrEmpty(dto.Email) && string.IsNullOrEmpty(dto.UserName) && string.IsNullOrEmpty(dto.EmployeeCode))
                return BadRequest("Email / Username / EmployeeCode required!");

            string loginInput = (dto.Email ?? dto.UserName ?? dto.EmployeeCode).Trim().ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == loginInput ||
                u.UserName.ToLower() == loginInput ||
                u.EmployeeCode.ToLower() == loginInput
            );

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Invalid account or password");

            // Lưu lịch sử đăng nhập
            _context.LoginHistories.Add(new LoginHistory
            {
                UserId = user.UserId,
                LoginTime = DateTime.Now,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers["User-Agent"]
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Token = GenerateJwtToken(user),
                User = Map(user),
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });
        }

      
        // GET CURRENT USER
       
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            int id = GetUserId();
            var u = await _context.Users.FindAsync(id);
            if (u == null) return NotFound();

            return Ok(new { user = Map(u) });
        }

      
        // UPDATE PROFILE
        
        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UserDTO dto)
        {
            int id = GetUserId();
            var u = await _context.Users.FindAsync(id);
            if (u == null) return NotFound();

            u.FullName = dto.FullName ?? u.FullName;
            u.Phone = dto.Phone ?? u.Phone;
            u.Address = dto.Address ?? u.Address;
            u.Gender = dto.Gender ?? u.Gender;
            u.BirthDate = dto.BirthDate ?? u.BirthDate;

            await _context.SaveChangesAsync();
            return Ok(new { user = Map(u) });
        }

   
        // CHANGE PASSWORD
       
        [Authorize]
        [HttpPost("password/change")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePassDTO dto)
        {
            // Add null coalescing
            if (string.IsNullOrEmpty(dto.Password ?? string.Empty) ||
                string.IsNullOrEmpty(dto.NewPassword ?? string.Empty) ||
                string.IsNullOrEmpty(dto.ConfirmPassword ?? string.Empty))
                return BadRequest("Missing password fields");

            if (dto.NewPassword != dto.ConfirmPassword)
                return BadRequest("New passwords do not match");

            // Add validation for password strength
            if (dto.NewPassword!.Length < 8)
                return BadRequest("Password must be at least 8 characters");

            int id = GetUserId();
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.Password!, user.PasswordHash))
                return BadRequest("Current password incorrect");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword!);
            await _context.SaveChangesAsync();

            return Ok("Password changed successfully.");
        }

        
        // MY LOGIN HISTORY (30 LAST)
       
        [Authorize]
        [HttpGet("my-login-history")]
        public async Task<IActionResult> MyLoginHistory()
        {
            int id = GetUserId();

            var logs = await _context.LoginHistories
                .Where(l => l.UserId == id)
                .OrderByDescending(l => l.LoginTime)
                .Take(30)
                .ToListAsync();

            return Ok(new { logs });
        }

       
        // REQUEST PASSWORD RESET (User gửi request)
       
        [HttpPost("request-password-reset")]
        public async Task<IActionResult> RequestPasswordReset([FromBody] CreatePasswordResetRequestDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.LoginInfo))
                return BadRequest("Vui lòng nhập thông tin đăng nhập (Email, Username hoặc Mã nhân viên)");

            string loginInfo = dto.LoginInfo.Trim().ToLower();

            // Tìm user theo Email, Username hoặc EmployeeCode
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == loginInfo ||
                u.UserName.ToLower() == loginInfo ||
                u.EmployeeCode.ToLower() == loginInfo
            );

            // Tạo request (dù có tìm thấy user hay không)
            var request = new PasswordResetRequest
            {
                LoginInfo = dto.LoginInfo.Trim(),
                UserId = user?.UserId,
                UserFullName = user?.FullName,
                UserEmployeeCode = user?.EmployeeCode,
                Status = "Pending",
                RequestDate = DateTime.Now
            };

            _context.PasswordResetRequests.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Yêu cầu reset mật khẩu đã được gửi. Admin sẽ xử lý yêu cầu của bạn.",
                requestId = request.PasswordResetRequestId
            });
        }

     
        // HELPERS
      
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        private string GenerateJwtToken(User user)
        {
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? "DefaultKey123");
            var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim("EmployeeCode", user.EmployeeCode),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Role, user.Role)
            };
            //Token có thời hạn
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }



        private UserDTO Map(User u)
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
    }
}
