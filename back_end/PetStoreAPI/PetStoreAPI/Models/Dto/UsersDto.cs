namespace PetStoreAPI.Models.Dto
{
    public class UsersDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Name { get; set; }
        public string Surname { get; set; }
        public string? Email { get; set; }

        // Profil ile ilişkili ek özellikler
        public List<PostDto>? PetPosts { get; set; }
    }
}
