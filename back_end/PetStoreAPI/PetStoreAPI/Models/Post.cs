using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models
{
    public class Post
    {
        [Key]
        public int PostId { get; set; }

        public string UserId { get; set; }

        [ForeignKey("UserId")]
        [ValidateNever]
        public ApplicationUser? ApplicationUser { get; set; }
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


        public List<AdoptionRequest> AdoptionRequests { get; set; } = new List<AdoptionRequest>();


    }
}
