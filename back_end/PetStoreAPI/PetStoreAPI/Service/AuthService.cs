using PetStoreAPI.Data;
using PetStoreAPI.Models.Dto;
using PetStoreAPI.Models;
using PetStoreAPI.Service.IService;
using Microsoft.AspNetCore.Identity;

namespace PetStoreAPI.Service
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IJwtTokenGenerator _jwtTokenGenerator;
        public AuthService(AppDbContext db, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IJwtTokenGenerator jwtTokenGenerator)
        {
            _db = db;
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtTokenGenerator = jwtTokenGenerator;
        }

        public async Task<bool> AssignRole(string email, string roleName)
        {
            var user = _db.ApplicationUsers.FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
            if (user != null)
            {
                if (!_roleManager.RoleExistsAsync(roleName).GetAwaiter().GetResult())
                {
                    _roleManager.CreateAsync(new IdentityRole(roleName)).GetAwaiter().GetResult();
                }
                await _userManager.AddToRoleAsync(user, roleName);
                return true;
            }
            return false;
        }

        public async Task<LoginResponseDto> Login(LoginRequestDto loginRequestDTO)
        {

            var user = _db.ApplicationUsers.FirstOrDefault(u => u.UserName.ToLower() == loginRequestDTO.UserName.ToLower());
            bool isValid = await _userManager.CheckPasswordAsync(user, loginRequestDTO.Password);
            if (user == null || isValid == false)
            {
                return new LoginResponseDto() { User = null, Token = "" };
            }
            _db.ApplicationUsers.Update(user);
            await _db.SaveChangesAsync();


            var roles = await _userManager.GetRolesAsync(user);

            var token = _jwtTokenGenerator.GenerateToken(user, roles);

            UserDto userDto = new()
            {
                Email = user.Email,
                Id = user.Id,
                Name = user.Name
            };

            LoginResponseDto loginResponseDto = new LoginResponseDto()
            {
                User = userDto,
                Token = token,
            };
            return loginResponseDto;
        }

        public async Task<RegistrationResponseDto> Register(RegistrationRequestDto registrationRequestDTO)
        {
            try
            {
                // Username kontrolü
                var isExistUsername = _db.ApplicationUsers.FirstOrDefault(u => u.UserName == registrationRequestDTO.UserName);
                if (isExistUsername != null)
                {
                    return new RegistrationResponseDto
                    {
                        IsSuccessful = false,
                        ErrorMessage = "Username already taken"
                    };
                }

                // Email kontrolü
                var isExistEmail = _db.ApplicationUsers.FirstOrDefault(u => u.Email == registrationRequestDTO.Email);
                if (isExistEmail != null)
                {
                    return new RegistrationResponseDto
                    {
                        IsSuccessful = false,
                        ErrorMessage = "Email already taken"
                    };
                }

                ApplicationUser user = new()
                {
                    UserName = registrationRequestDTO.UserName,
                    Surname = registrationRequestDTO.Surname,
                    Email = registrationRequestDTO.Email,
                    NormalizedEmail = registrationRequestDTO.Email.ToUpper(),
                    Name = registrationRequestDTO.Name
                };

                var result = await _userManager.CreateAsync(user, registrationRequestDTO.Password);
                if (result.Succeeded)
                {
                    // Kullanıcı başarıyla oluşturuldu - fresh data için tekrar çek
                    var createdUser = await _userManager.FindByNameAsync(registrationRequestDTO.UserName);

                    UserDto userDto = new()
                    {
                        Id = createdUser.Id,
                        Email = createdUser.Email,
                        Name = createdUser.Name,
                        Surname = createdUser.Surname,
                        UserName = createdUser.UserName
                    };

                    return new RegistrationResponseDto
                    {
                        IsSuccessful = true,
                        User = userDto
                    };
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    return new RegistrationResponseDto
                    {
                        IsSuccessful = false,
                        ErrorMessage = errors
                    };
                }
            }
            catch (Exception ex)
            {
                // Log the exception
                return new RegistrationResponseDto
                {
                    IsSuccessful = false,
                    ErrorMessage = "Registration failed due to an unexpected error"
                };
            }
        }
    }
}
