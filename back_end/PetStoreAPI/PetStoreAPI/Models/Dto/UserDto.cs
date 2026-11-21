using System.ComponentModel.DataAnnotations.Schema;

namespace PetStoreAPI.Models.Dto
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? UserName { get; set; }
    }
}
