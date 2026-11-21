using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models.Dto
{
    public class RegistrationRequestDto
    {
        [Required(AllowEmptyStrings = false, ErrorMessage = "İsim zorunludur.")]
        [StringLength(50, ErrorMessage = "İsim en fazla 50 karakter olabilir.")]
        public string? Name { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Soyisim zorunludur.")]
        [StringLength(50, ErrorMessage = "Soyisim en fazla 50 karakter olabilir.")]
        public string? Surname { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Kullanıcı adı zorunludur.")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Kullanıcı adı 3-50 karakter olmalıdır.")]
        public string? UserName { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Email zorunludur.")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz.")]
        [StringLength(256, ErrorMessage = "Email en fazla 256 karakter olabilir.")]
        public string? Email { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "Şifre zorunludur.")]
        public string? Password { get; set; }
    }
}
