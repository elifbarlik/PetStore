using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using static PetStoreAPI_Utility.SD;
namespace PetStoreAPI.Models
{
    public class AdoptionRequest
    {
        [Key]
        public int RequestId { get; set; }

        // İsteği gönderen
        public string UserId { get; set; }
        public ApplicationUser? RequesterUser { get; set; }

        

        // İlgili ilan
        public int PostId { get; set; }
        [ForeignKey("PostId")]
        public Post? Post { get; set; }

        public string Message { get; set; } // İstek mesajı
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public DateTime RequestDate { get; set; } = DateTime.Now;
        public string? Response { get; set; } // Sahip yanıtı
        public bool? IsActive { get; set; } = true;
    }
}
