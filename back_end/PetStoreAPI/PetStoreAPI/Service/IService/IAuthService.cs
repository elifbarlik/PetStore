using PetStoreAPI.Models.Dto;

namespace PetStoreAPI.Service.IService
{
    public interface IAuthService
    {
        Task<LoginResponseDto> Login(LoginRequestDto loginRequestDTO);
        Task<RegistrationResponseDto> Register(RegistrationRequestDto registrationRequestDTO);
    }
}
