using Microsoft.AspNetCore.Identity;

namespace PetStoreAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;

        public List<Post>? Posts { get; set; } = new List<Post>();
    }
}
