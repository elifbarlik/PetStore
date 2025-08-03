using Microsoft.AspNetCore.Identity;

namespace PetStoreAPI.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; }
        public string Surname { get; set; }

        public List<Post>? Posts { get; set; } = new List<Post>();
    }
}
