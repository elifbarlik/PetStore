using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PetStoreAPI.Data;
using PetStoreAPI.Helpers;
using PetStoreAPI.Mappings;
using PetStoreAPI.Models;
using PetStoreAPI.Models.Dto;
using System.Net;
using System.Security.Claims;
using static PetStoreAPI_Utility.SD;

namespace PetStoreAPI.Controllers
{
    /// <summary>
    /// Adoption listings. Every action returns the <see cref="ResponseDto"/> envelope and the
    /// SAME status code as the HTTP response status (200, 201, 400, 403, 404, 500).
    /// </summary>
    [Route("api/post")]
    [ApiController]
    public class PostController : ControllerBase
    {
        private const string PlaceholderImageUrl = "https://placehold.co/600x400";

        private readonly ILogger<PostController> _logger;
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public PostController(ILogger<PostController> logger, AppDbContext db, IWebHostEnvironment env)
        {
            _logger = logger;
            _db = db;
            _env = env;
        }

        /// <summary>Id of the authenticated caller, taken from the JWT (never from the request).</summary>
        private string? CurrentUserId =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

        private string PostImagesDirectory => Path.Combine(_env.ContentRootPath, "wwwroot", "PostImages");

        private ObjectResult Respond(HttpStatusCode status, object? result = null, string message = "")
        {
            var body = new ResponseDto
            {
                Result = result,
                StatusCode = status,
                IsSuccess = (int)status < 400,
                Message = message,
            };
            return StatusCode((int)status, body);
        }

        private ObjectResult Forbidden(string message)
        {
            _logger.LogWarning("Yetkisiz işlem denemesi. UserId: {UserId}, Mesaj: {Message}", CurrentUserId, message);
            return Respond(HttpStatusCode.Forbidden, message: message);
        }

        private IQueryable<Post> PostsWithOwner() =>
            _db.Posts.AsNoTracking().Include(p => p.ApplicationUser);

        [HttpGet("GetAllPosts")]
        public async Task<ActionResult<ResponseDto>> GetAllPosts()
        {
            var posts = await PostsWithOwner()
                .OrderByDescending(p => p.PostTime)
                .ToListAsync();

            return Respond(HttpStatusCode.OK, posts.ToDtos());
        }

        [HttpGet("GetPostById/{id:int}")]
        public async Task<ActionResult<ResponseDto>> GetPostById(int id)
        {
            var post = await PostsWithOwner().FirstOrDefaultAsync(p => p.PostId == id);
            if (post == null)
                return Respond(HttpStatusCode.NotFound, message: "İlan bulunamadı");

            return Respond(HttpStatusCode.OK, post.ToDto());
        }

        [HttpGet("GetPostsByUserId/{userId}")]
        public async Task<ActionResult<ResponseDto>> GetPostsByUserId(string userId)
        {
            var posts = await PostsWithOwner()
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.PostTime)
                .ToListAsync();

            return Respond(HttpStatusCode.OK, posts.ToDtos());
        }

        [HttpPost("CreatePost")]
        [Authorize]
        public async Task<ActionResult<ResponseDto>> CreatePost(PostDto postDto)
        {
            // İlan yalnızca token sahibi adına oluşturulabilir
            if (postDto.UserId != CurrentUserId)
                return Forbidden("Başka bir kullanıcı adına ilan oluşturamazsınız.");

            // Dosya, kayıttan ÖNCE doğrulanır: geçersiz yüklemede yetim kayıt kalmaz
            string? extension = null;
            if (postDto.Image is { Length: > 0 })
            {
                var error = ImageFileValidator.Validate(postDto.Image, out var ext);
                if (error != null)
                    return Respond(HttpStatusCode.BadRequest, message: error);
                extension = ext;
            }

            if (!await _db.Users.AsNoTracking().AnyAsync(u => u.Id == postDto.UserId))
                return Respond(HttpStatusCode.NotFound, message: "Kullanıcı bulunamadı.");

            var post = postDto.ToNewEntity();
            post.PostTime = DateTime.UtcNow;
            post.IsAdopted = false;
            post.UserId = postDto.UserId;
            post.ImageUrl = PlaceholderImageUrl;

            await using var transaction = await _db.Database.BeginTransactionAsync();
            _db.Posts.Add(post);
            await _db.SaveChangesAsync(); // PostId gerekir (dosya adı)

            string? writtenFile = null;
            try
            {
                if (postDto.Image != null && extension != null)
                {
                    (post.ImageUrl, post.ImageLocalPath, writtenFile) = await SaveImageAsync(postDto.Image, post.PostId, extension);
                    await _db.SaveChangesAsync();
                }
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İlan oluşturma hatası. UserId: {UserId}", postDto.UserId);
                if (writtenFile != null && System.IO.File.Exists(writtenFile))
                    System.IO.File.Delete(writtenFile);
                throw; // işlem geri alınır, global hata yakalayıcı 500 döner
            }

            var saved = await PostsWithOwner().FirstAsync(p => p.PostId == post.PostId);
            _logger.LogInformation("İlan oluşturuldu. PostId: {PostId}, UserId: {UserId}", post.PostId, post.UserId);
            return Respond(HttpStatusCode.Created, saved.ToDto(), "Post başarıyla oluşturuldu.");
        }

        [HttpPut("UpdatePost")]
        [Authorize]
        public async Task<ActionResult<ResponseDto>> UpdatePost(PostDto postDto)
        {
            var existingPost = await _db.Posts.FirstOrDefaultAsync(p => p.PostId == postDto.PostId);
            if (existingPost == null)
                return Respond(HttpStatusCode.NotFound, message: "Güncellenecek post bulunamadı.");

            if (existingPost.UserId != CurrentUserId)
                return Forbidden("Sadece kendi ilanınızı güncelleyebilirsiniz.");

            string? extension = null;
            if (postDto.Image is { Length: > 0 })
            {
                var error = ImageFileValidator.Validate(postDto.Image, out var ext);
                if (error != null)
                    return Respond(HttpStatusCode.BadRequest, message: error);
                extension = ext;
            }

            existingPost.Title = postDto.Title?.Trim();
            existingPost.PetName = postDto.PetName?.Trim();
            existingPost.PetType = postDto.PetType?.Trim();
            existingPost.Description = postDto.Description?.Trim();
            existingPost.PostLatitude = postDto.PostLatitude;
            existingPost.PostLongitude = postDto.PostLongitude;
            // IsAdopted, PostTime ve sahiplik bilinçli olarak güncellenmez

            if (postDto.Image != null && extension != null)
            {
                var oldFile = existingPost.ImageLocalPath;
                (existingPost.ImageUrl, existingPost.ImageLocalPath, var newFile) =
                    await SaveImageAsync(postDto.Image, existingPost.PostId, extension);

                // Eski dosya farklı uzantıdaysa sil (aynı adda ise zaten üzerine yazıldı)
                if (!string.IsNullOrEmpty(oldFile))
                {
                    var oldFull = Path.Combine(_env.ContentRootPath, oldFile);
                    if (!string.Equals(Path.GetFullPath(oldFull), Path.GetFullPath(newFile), StringComparison.OrdinalIgnoreCase))
                        TryDeleteFile(oldFull);
                }
            }

            await _db.SaveChangesAsync();

            var updated = await PostsWithOwner().FirstAsync(p => p.PostId == existingPost.PostId);
            _logger.LogInformation("İlan güncellendi. PostId: {PostId}", existingPost.PostId);
            return Respond(HttpStatusCode.OK, updated.ToDto(), "Post başarıyla güncellendi.");
        }

        [HttpDelete("DeletePost/{id:int}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto>> DeletePost(int id)
        {
            var post = await _db.Posts.FirstOrDefaultAsync(p => p.PostId == id);
            if (post == null)
                return Respond(HttpStatusCode.NotFound, message: "Silinecek post bulunamadı.");

            if (post.UserId != CurrentUserId)
                return Forbidden("Sadece kendi ilanınızı silebilirsiniz.");

            var hasActiveAdoption = await _db.AdoptionRequests
                .AnyAsync(ar => ar.PostId == id && ar.IsActive == true);
            if (hasActiveAdoption)
                return Respond(HttpStatusCode.BadRequest,
                    message: "Sahiplenilmiş bir ilan silinemez. Önce sahiplenmeyi iptal edin.");

            // Pasif (iptal edilmiş) talepler ilanla birlikte cascade silinir
            _db.Posts.Remove(post);
            await _db.SaveChangesAsync();

            if (!string.IsNullOrEmpty(post.ImageLocalPath))
                TryDeleteFile(Path.Combine(_env.ContentRootPath, post.ImageLocalPath));

            _logger.LogInformation("İlan silindi. PostId: {PostId}", id);
            return Respond(HttpStatusCode.OK, message: "Post başarıyla silindi.");
        }

        [HttpPost("AdoptPost/{id:int}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto>> AdoptPost(int id)
        {
            var post = await _db.Posts.AsNoTracking().FirstOrDefaultAsync(p => p.PostId == id);
            if (post == null)
                return Respond(HttpStatusCode.NotFound, message: "Sahiplenilecek post bulunamadı.");

            var userId = CurrentUserId!;
            if (post.UserId == userId)
                return Forbidden("Kendi ilanınızı sahiplenemezsiniz.");

            var adopter = await _db.ApplicationUsers.FirstOrDefaultAsync(u => u.Id == userId);
            if (adopter == null)
                return Respond(HttpStatusCode.NotFound, message: "Kullanıcı bulunamadı.");

            await using var transaction = await _db.Database.BeginTransactionAsync();

            // Atomik koşullu güncelleme: aynı anda gelen iki istekten yalnızca biri kazanır
            var affected = await _db.Posts
                .Where(p => p.PostId == id && !p.IsAdopted)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsAdopted, true));
            if (affected == 0)
                return Respond(HttpStatusCode.BadRequest, message: "Bu ilan zaten sahiplenilmiş.");

            // Sahiplenme kaydı: kimin, ne zaman sahiplendiği izlenir ve silme kuralı uygulanabilir
            _db.AdoptionRequests.Add(new AdoptionRequest
            {
                PostId = id,
                UserId = userId,
                RequesterUser = adopter,
                Message = string.Empty,
                Status = RequestStatus.Approved,
                RequestDate = DateTime.UtcNow,
                IsActive = true,
            });
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var updated = await PostsWithOwner().FirstAsync(p => p.PostId == id);
            _logger.LogInformation("İlan sahiplenildi. PostId: {PostId}, AdopterId: {UserId}", id, userId);
            return Respond(HttpStatusCode.OK, updated.ToDto(),
                $"'{post.PetName}' isimli hayvan başarıyla sahiplenildi!");
        }

        [HttpPost("CancelAdoption/{id:int}")]
        [Authorize]
        public async Task<ActionResult<ResponseDto>> CancelAdoption(int id)
        {
            var post = await _db.Posts.FirstOrDefaultAsync(p => p.PostId == id);
            if (post == null)
                return Respond(HttpStatusCode.NotFound, message: "Post bulunamadı.");

            // Sahiplenmeyi yalnızca ilan sahibi iptal edebilir
            if (post.UserId != CurrentUserId)
                return Forbidden("Sadece ilan sahibi sahiplenmeyi iptal edebilir.");

            if (!post.IsAdopted)
                return Respond(HttpStatusCode.BadRequest, message: "Bu ilan zaten sahiplenilmemiş durumda.");

            post.IsAdopted = false;
            var activeRequests = await _db.AdoptionRequests
                .Where(ar => ar.PostId == id && ar.IsActive == true)
                .ToListAsync();
            foreach (var request in activeRequests)
            {
                request.IsActive = false;
                request.Status = RequestStatus.Rejected;
                request.Response = "Sahiplenme ilan sahibi tarafından iptal edildi.";
            }
            await _db.SaveChangesAsync();

            var updated = await PostsWithOwner().FirstAsync(p => p.PostId == id);
            _logger.LogInformation("Sahiplenme iptal edildi. PostId: {PostId}", id);
            return Respond(HttpStatusCode.OK, updated.ToDto(),
                $"'{post.PetName}' isimli hayvanın sahiplenme durumu iptal edildi.");
        }

        /// <returns>(public URL, content-root-relative path, absolute file path)</returns>
        private async Task<(string Url, string LocalPath, string FullPath)> SaveImageAsync(IFormFile image, int postId, string extension)
        {
            Directory.CreateDirectory(PostImagesDirectory);
            var fileName = postId + extension;
            var fullPath = Path.Combine(PostImagesDirectory, fileName);

            await using (var fileStream = new FileStream(fullPath, FileMode.Create))
            {
                await image.CopyToAsync(fileStream);
            }

            var baseUrl = $"{Request.Scheme}://{Request.Host.Value}{Request.PathBase.Value}";
            return ($"{baseUrl}/PostImages/{fileName}", Path.Combine("wwwroot", "PostImages", fileName), fullPath);
        }

        private void TryDeleteFile(string fullPath)
        {
            try
            {
                if (System.IO.File.Exists(fullPath))
                    System.IO.File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                // Dosya silinemese de veri tutarlılığı korunur; sadece loglanır
                _logger.LogWarning(ex, "Resim dosyası silinemedi: {Path}", fullPath);
            }
        }
    }
}
