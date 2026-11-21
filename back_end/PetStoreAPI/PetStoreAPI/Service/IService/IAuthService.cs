using PetStoreAPI.Models.Dto;

namespace PetStoreAPI.Service.IService
{
    public interface IAuthService
    {
        /// <summary>Returns the token + profile on success, or a user-facing error message.</summary>
        Task<(LoginResponseDto? Response, string? Error)> Login(LoginRequestDto loginRequestDTO);
        Task<RegistrationResponseDto> Register(RegistrationRequestDto registrationRequestDTO);
    }
}
