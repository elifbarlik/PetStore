using static PetStoreAPI_Utility.SD;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace PetStoreAPI.Models.Dto
{
    public class AdoptionRequestDto
    {
        public int RequestId { get; set; }

        // İsteği gönderen
        public string RequesterUserId { get; set; }
        public UserDto? RequesterUser { get; set; }

        // İlgili ilan
        public int PostId { get; set; }

        public string Message { get; set; } // İstek mesajı
        public RequestStatus Status { get; set; } = RequestStatus.Pending;
        public DateTime RequestDate { get; set; } = DateTime.Now;
        public string? Response { get; set; } // Sahip yanıtı
        public bool? IsActive { get; set; }
    }
}
