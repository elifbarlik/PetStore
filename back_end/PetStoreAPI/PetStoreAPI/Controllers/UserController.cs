using PetStoreAPI.Data;
using PetStoreAPI.Models;
using PetStoreAPI.Models.Dto;
using PetStoreAPI.Service.IService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace PetStoreAPI.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IAuthService _authService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;
        protected ResponseDto _responseDto;
        public UserController(IAuthService authService, IConfiguration configuration, AppDbContext db,
            UserManager<ApplicationUser> userManager, ILogger<UserController> logger)
        {

            _configuration = configuration;
            _userManager = userManager;
            _authService = authService;
            _db = db;
            _responseDto = new();
            _logger = logger;
        }



        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegistrationRequestDto model)
        {
            var result = await _authService.Register(model);

            if (!result.IsSuccessful)
            {
                _logger.LogInformation("Request received by Controller: {Controller}, Action: {Action}, " +
                    "Datetime: {Datetime}", nameof(UserController), nameof(Register), DateTime.Now.ToString());
                _logger.LogWarning("Kayıt oluşturulamadı: {ErrorMessage}", result.ErrorMessage);

                _responseDto.IsSuccess = false;
                _responseDto.Message = result.ErrorMessage;
                return BadRequest(_responseDto);
            }

            _logger.LogInformation("Request received by Controller: {Controller}, Action: {Action}, " +
                "Datetime: {Datetime}", nameof(UserController), nameof(Register), DateTime.Now.ToString());
            _logger.LogInformation("Kayıt başarıyla oluşturuldu. UserId: {UserId}", result.User?.Id);

            _responseDto.IsSuccess = true;
            _responseDto.Message = "Registration successful";
            _responseDto.Result = result.User; // Oluşturulan kullanıcı bilgilerini döndür

            return Ok(_responseDto);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto model)
        {
            // Kullanıcıyı veritabanından al
            var user = await _db.ApplicationUsers.FirstOrDefaultAsync(u => u.UserName == model.UserName);

            // Kullanıcı yoksa ya da kilitlenmişse
            if (user == null || (user.LockoutEnd != null && user.LockoutEnd > DateTime.Now))
            {
                _logger.LogInformation("Request recieved by Controller: {Controller}, Action: {Action}," +
                    "Datetime: {Datetime}", new object[] { nameof(UserController), nameof(Post), DateTime.Now.ToString() });
                _logger.LogInformation("Kullanıcı kilitli veya geçersiz kullanıcı adı/şifre.");
                _responseDto.IsSuccess = false;
                _responseDto.Message = "Kullanıcı kilitli veya geçersiz kullanıcı adı/şifre.";
                return BadRequest(_responseDto);
            }

            // Eğer kullanıcı mevcutsa, login işlemine devam et
            var loginResponse = await _authService.Login(model);

            if (loginResponse.User == null)
            {
                _logger.LogInformation("Request recieved by Controller: {Controller}, Action: {Action}," +
                    "Datetime: {Datetime}", new object[] { nameof(UserController), nameof(Post), DateTime.Now.ToString() });
                _logger.LogInformation("Kullanıcı adı veya şifre yanlış.");
                _responseDto.IsSuccess = false;
                _responseDto.Message = "Kullanıcı adı veya şifre yanlış.";
                return BadRequest(_responseDto);
            }
            _logger.LogInformation("Request recieved by Controller: {Controller}, Action: {Action}," +
                    "Datetime: {Datetime}", new object[] { nameof(UserController), nameof(Post), DateTime.Now.ToString() });
            _logger.LogInformation("Giriş başarıyla yapıldı.");
            _responseDto.Result = loginResponse;
            return Ok(_responseDto);
        }


        //[HttpPost("AssignRole")]
        //public async Task<IActionResult> AssignRole([FromBody] RegistrationRequestDto model)
        //{
        //    var assignRoleSuccessfull = await _authService.AssignRole(model.Email, model.Role.ToUpper());
        //    if (!assignRoleSuccessfull)
        //    {
        //        _logger.LogInformation("Request recieved by Controller: {Controller}, Action: {Action}," +
        //            "Datetime: {Datetime}", new object[] { nameof(UserController), nameof(Post), DateTime.Now.ToString() });
        //        _logger.LogInformation("Error Encountered");
        //        _responseDto.IsSuccess = false;
        //        _responseDto.Message = "Error Encountered";
        //        return BadRequest(_responseDto);
        //    }
        //    _logger.LogInformation("Request recieved by Controller: {Controller}, Action: {Action}," +
        //            "Datetime: {Datetime}", new object[] { nameof(UserController), nameof(Post), DateTime.Now.ToString() });
        //    _logger.LogInformation("Rol başarıyla atandı.");
        //    return Ok(_responseDto);
        //}



    }
}
