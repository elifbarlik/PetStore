namespace PetStoreAPI.Models.Dto
{
    public class LoginResponseDto
    {
        public UserDto User { get; set; } = new();
        public string Token { get; set; } = string.Empty;
    }
}
