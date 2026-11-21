using Microsoft.AspNetCore.Mvc;
using PetStoreAPI.Models.Dto;
using PetStoreAPI.Service.IService;
using System.Net;

namespace PetStoreAPI.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ILogger<UserController> _logger;
        private readonly IAuthService _authService;

        public UserController(IAuthService authService, ILogger<UserController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("Register")]
        public async Task<ActionResult<ResponseDto>> Register([FromBody] RegistrationRequestDto model)
        {
            var result = await _authService.Register(model);

            if (!result.IsSuccessful)
            {
                _logger.LogWarning("Kayıt oluşturulamadı: {ErrorMessage}", result.ErrorMessage);
                return BadRequest(new ResponseDto
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = result.ErrorMessage ?? "Kayıt oluşturulamadı.",
                });
            }

            _logger.LogInformation("Kayıt başarıyla oluşturuldu. UserId: {UserId}", result.User?.Id);
            return Ok(new ResponseDto
            {
                IsSuccess = true,
                StatusCode = HttpStatusCode.OK,
                Message = "Registration successful",
                Result = result.User,
            });
        }

        [HttpPost("Login")]
        public async Task<ActionResult<ResponseDto>> Login([FromBody] LoginRequestDto model)
        {
            var (response, error) = await _authService.Login(model);

            if (response == null)
            {
                _logger.LogInformation("Başarısız giriş denemesi. UserName: {UserName}", model.UserName);
                return BadRequest(new ResponseDto
                {
                    IsSuccess = false,
                    StatusCode = HttpStatusCode.BadRequest,
                    Message = error ?? "Giriş başarısız.",
                });
            }

            _logger.LogInformation("Giriş başarılı. UserId: {UserId}", response.User.Id);
            return Ok(new ResponseDto
            {
                IsSuccess = true,
                StatusCode = HttpStatusCode.OK,
                Result = response,
            });
        }
    }
}
