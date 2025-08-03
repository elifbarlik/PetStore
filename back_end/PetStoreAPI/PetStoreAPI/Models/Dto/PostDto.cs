using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models.Dto
{
    public class PostDto
    {
        public int PostId { get; set; }

        public string UserId { get; set; }

        public UserDto? User { get; set; }
        public string? Title { get; set; } // İlan başlığı
        public string? PetName { get; set; } // Hayvan adı
        public string? PetType { get; set; } // Köpek, Kedi vs.
        public string? Description { get; set; } // Açıklama
        public bool IsAdopted { get; set; } = false; // Sahiplenildi mi
        public DateTime PostTime { get; set; }
        public double? PostLatitude { get; set; }
        public double? PostLongitude { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageLocalPath { get; set; }
        public IFormFile? Image { get; set; }
    }
}
