using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models.Dto
{
    public class LoginRequestDto
    {
        [Required(AllowEmptyStrings = false, ErrorMessage = "Kullanıcı adı zorunludur.")]
        public string UserName { get; set; } = string.Empty;

        [Required(AllowEmptyStrings = false, ErrorMessage = "Şifre zorunludur.")]
        public string Password { get; set; } = string.Empty;
    }
}
