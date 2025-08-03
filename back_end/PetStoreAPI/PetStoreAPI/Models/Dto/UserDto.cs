using System.ComponentModel.DataAnnotations.Schema;

namespace PetStoreAPI.Models.Dto
{
    public class UserDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string? UserName { get; set; }
        public List<PostDto>? Posts { get; set; }
    }
}
