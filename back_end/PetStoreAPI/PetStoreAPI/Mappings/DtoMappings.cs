using PetStoreAPI.Models;
using PetStoreAPI.Models.Dto;

namespace PetStoreAPI.Mappings
{
    /// <summary>
    /// Explicit entity &lt;-&gt; DTO mapping. Replaces AutoMapper: the mappings are small, this keeps
    /// them compile-time checked and removes a dependency with known DoS vulnerabilities.
    /// </summary>
    public static class DtoMappings
    {
        public static UserDto ToDto(this ApplicationUser user) => new()
        {
            Id = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            Email = user.Email ?? string.Empty,
            UserName = user.UserName,
        };

        public static PostDto ToDto(this Post post) => new()
        {
            PostId = post.PostId,
            UserId = post.UserId,
            User = post.ApplicationUser?.ToDto(),
            Title = post.Title,
            PetName = post.PetName,
            PetType = post.PetType,
            Description = post.Description,
            IsAdopted = post.IsAdopted,
            PostTime = post.PostTime,
            PostLatitude = post.PostLatitude,
            PostLongitude = post.PostLongitude,
            ImageUrl = post.ImageUrl,
            ImageLocalPath = post.ImageLocalPath,
        };

        public static List<PostDto> ToDtos(this IEnumerable<Post> posts) => posts.Select(p => p.ToDto()).ToList();

        /// <summary>
        /// Creates a new entity from client input. Server-controlled fields (id, owner, time,
        /// adoption state, image) are deliberately NOT copied from the request.
        /// </summary>
        public static Post ToNewEntity(this PostDto dto) => new()
        {
            Title = dto.Title?.Trim(),
            PetName = dto.PetName?.Trim(),
            PetType = dto.PetType?.Trim(),
            Description = dto.Description?.Trim(),
            PostLatitude = dto.PostLatitude,
            PostLongitude = dto.PostLongitude,
        };
    }
}
