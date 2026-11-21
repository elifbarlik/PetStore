using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PetStoreAPI.Models;
using PetStoreAPI.Models.Dto;
using PetStoreAPI.Service.IService;

namespace PetStoreAPI.Service
{
    public class AuthService : IAuthService
    {
        public const string InvalidCredentialsMessage = "Kullanıcı adı veya şifre yanlış.";
        public const string LockedOutMessage = "Çok fazla hatalı giriş denemesi. Hesabınız geçici olarak kilitlendi, lütfen daha sonra tekrar deneyin.";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        private readonly ILogger<AuthService> _logger;

        public AuthService(UserManager<ApplicationUser> userManager, IJwtTokenGenerator jwtTokenGenerator, ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _jwtTokenGenerator = jwtTokenGenerator;
            _logger = logger;
        }

        public async Task<(LoginResponseDto? Response, string? Error)> Login(LoginRequestDto loginRequestDTO)
        {
            // FindByNameAsync uses the indexed NormalizedUserName column (case-insensitive)
            var user = await _userManager.FindByNameAsync(loginRequestDTO.UserName);

            // Same message for unknown user and wrong password: no account enumeration
            if (user == null)
                return (null, InvalidCredentialsMessage);

            if (await _userManager.IsLockedOutAsync(user))
            {
                _logger.LogWarning("Kilitli hesaba giriş denemesi. UserId: {UserId}", user.Id);
                return (null, LockedOutMessage);
            }

            if (!await _userManager.CheckPasswordAsync(user, loginRequestDTO.Password))
            {
                // Brute-force protection: Identity locks the account after MaxFailedAccessAttempts
                await _userManager.AccessFailedAsync(user);
                if (await _userManager.IsLockedOutAsync(user))
                {
                    _logger.LogWarning("Hesap kilitlendi. UserId: {UserId}", user.Id);
                    return (null, LockedOutMessage);
                }
                return (null, InvalidCredentialsMessage);
            }

            if (await _userManager.GetAccessFailedCountAsync(user) > 0)
                await _userManager.ResetAccessFailedCountAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwtTokenGenerator.GenerateToken(user, roles);

            return (new LoginResponseDto
            {
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email!,
                    Name = user.Name,
                    Surname = user.Surname,
                    UserName = user.UserName,
                },
                Token = token,
            }, null);
        }

        public async Task<RegistrationResponseDto> Register(RegistrationRequestDto registrationRequestDTO)
        {
            try
            {
                if (await _userManager.FindByNameAsync(registrationRequestDTO.UserName!) != null)
                    return Fail("Username already taken");

                if (await _userManager.FindByEmailAsync(registrationRequestDTO.Email!) != null)
                    return Fail("Email already taken");

                ApplicationUser user = new()
                {
                    UserName = registrationRequestDTO.UserName,
                    Email = registrationRequestDTO.Email,
                    Name = registrationRequestDTO.Name!,
                    Surname = registrationRequestDTO.Surname!,
                };

                // UserManager hashes the password and fills the normalized name/email columns
                var result = await _userManager.CreateAsync(user, registrationRequestDTO.Password!);
                if (!result.Succeeded)
                    return Fail(string.Join(", ", result.Errors.Select(e => e.Description)));

                return new RegistrationResponseDto
                {
                    IsSuccessful = true,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email!,
                        Name = user.Name,
                        Surname = user.Surname,
                        UserName = user.UserName,
                    },
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kayıt sırasında beklenmeyen hata. UserName: {UserName}", registrationRequestDTO.UserName);
                return Fail("Registration failed due to an unexpected error");
            }
        }

        private static RegistrationResponseDto Fail(string message) =>
            new() { IsSuccessful = false, ErrorMessage = message };
    }
}
