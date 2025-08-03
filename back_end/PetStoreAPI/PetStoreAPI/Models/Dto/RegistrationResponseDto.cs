namespace PetStoreAPI.Models.Dto
{
    public class RegistrationResponseDto
    {
        public bool IsSuccessful { get; set; }
        public string? ErrorMessage { get; set; }
        public UserDto? User { get; set; }
    }
}
