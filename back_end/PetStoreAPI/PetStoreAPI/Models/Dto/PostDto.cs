using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models.Dto
{
    public class PostDto
    {
        public int PostId { get; set; }

        [Required(ErrorMessage = "UserId zorunludur.")]
        public string UserId { get; set; } = string.Empty;

        public UserDto? User { get; set; }

        [Required(AllowEmptyStrings = false, ErrorMessage = "İlan başlığı zorunludur.")]
        [StringLength(100, ErrorMessage = "İlan başlığı en fazla 100 karakter olabilir.")]
        public string? Title { get; set; } // İlan başlığı

        [Required(AllowEmptyStrings = false, ErrorMessage = "Evcil hayvan adı zorunludur.")]
        [StringLength(50, ErrorMessage = "Evcil hayvan adı en fazla 50 karakter olabilir.")]
        public string? PetName { get; set; } // Hayvan adı

        [Required(AllowEmptyStrings = false, ErrorMessage = "Evcil hayvan türü zorunludur.")]
        [StringLength(50, ErrorMessage = "Evcil hayvan türü en fazla 50 karakter olabilir.")]
        public string? PetType { get; set; } // Köpek, Kedi vs.

        [Required(AllowEmptyStrings = false, ErrorMessage = "Açıklama zorunludur.")]
        [StringLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olabilir.")]
        public string? Description { get; set; } // Açıklama

        public bool IsAdopted { get; set; } = false; // Sahiplenildi mi
        public DateTime PostTime { get; set; }

        [Range(-90, 90, ErrorMessage = "Enlem -90 ile 90 arasında olmalıdır.")]
        public double? PostLatitude { get; set; }

        [Range(-180, 180, ErrorMessage = "Boylam -180 ile 180 arasında olmalıdır.")]
        public double? PostLongitude { get; set; }

        public string? ImageUrl { get; set; }
        public string? ImageLocalPath { get; set; }
        public IFormFile? Image { get; set; }
    }
}
