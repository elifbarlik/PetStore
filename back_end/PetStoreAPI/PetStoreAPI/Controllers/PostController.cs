using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PetStoreAPI.Data;
using PetStoreAPI.Models.Dto;
using PetStoreAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Net;
using Microsoft.AspNetCore.Authorization;

namespace PetStoreAPI.Controllers
{
    [Route("api/post")]
    [ApiController]

    public class PostController : ControllerBase
    {
        private readonly ILogger<PostController> _logger;
        private readonly IConfiguration _configuration;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _db;
        private IMapper _mapper;
        protected ResponseDto _response;


        private readonly IServiceProvider _serviceProvider;


        public PostController(
            ILogger<PostController> logger,
            IConfiguration configuration,
            AppDbContext db,
            UserManager<ApplicationUser> userManager,
            IMapper mapper,
            IServiceProvider serviceProvider

            )
        {
            _mapper = mapper;
            _configuration = configuration;
            _userManager = userManager;
            _db = db;
            _response = new();
            _logger = logger;
            _serviceProvider = serviceProvider;

        }

        [HttpGet]
        [Route("GetAllPosts")]
        public async Task<ResponseDto> GetAllPost()
        {
            try
            {
                // Sadece navigation property'leri Include et
                var posts = await _db.Posts
                    .Include(p => p.ApplicationUser)      // Navigation property ✓
                    .Include(p => p.AdoptionRequests)     // Navigation property ✓
                        .ThenInclude(ar => ar.RequesterUser) // İsteğe bağlı: AdoptionRequest'in User'ını da dahil et
                    .OrderByDescending(p => p.PostTime)   // En yeni postlar önce
                    .ToListAsync();

                if (posts == null || !posts.Any())
                {
                    _response.IsSuccess = false;
                    _response.Message = "İlan bulunamadı";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                _response.Result = _mapper.Map<List<PostDto>>(posts);
                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"İlanlar başarıyla getirildi. Toplam: {posts.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"İlan getirme hatası, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }

        [HttpGet]
        [Route("GetPostById/{id:int}")]
        public async Task<ResponseDto> GetPostById(int id, string? UserId)
        {
            try
            {
                // Sadece navigation property'leri Include et
                var post = await _db.Posts
                    .Include(p => p.ApplicationUser)      // Navigation property ✓
                    .Include(p => p.AdoptionRequests)     // Navigation property ✓
                        .ThenInclude(ar => ar.RequesterUser) // AdoptionRequest'lerin User'larını da getir
                    .FirstOrDefaultAsync(p => p.PostId == id);

                if (post == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "İlan bulunamadı";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                // UserId kontrolü isteğe bağlı - ihtiyacınıza göre kaldırabilirsiniz
                if (!string.IsNullOrEmpty(UserId) && post.UserId != UserId)
                {
                    _logger.LogWarning($"Post sahibi farklı. PostId: {id}, RequestUserId: {UserId}, PostOwnerId: {post.UserId}");
                    // Bu kontrolü kaldırmak isteyebilirsiniz çünkü herkes her postu görebilmeli
                }

                // Post'u DTO'ya map et
                var postDto = _mapper.Map<PostDto>(post);

                _response.Result = postDto; // Gereksiz wrapper'ı kaldırdım
                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"İlan başarıyla getirildi. PostId: {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"İlan getirme hatası. PostId: {id}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }

            return _response;
        }

        [HttpGet]
        [Route("GetPostsByUserId/{userId}")]
        public async Task<ResponseDto> GetPostsByUserId(string userId)
        {
            try
            {
                var userPosts = await _db.Posts
                    .Include(p => p.ApplicationUser)
                    .Include(p => p.AdoptionRequests)
                        .ThenInclude(ar => ar.RequesterUser)
                    .Where(p => p.UserId == userId)
                    .OrderByDescending(p => p.PostTime)
                    .ToListAsync();

                if (userPosts == null || !userPosts.Any())
                {
                    _response.IsSuccess = false;
                    _response.Message = "Bu kullanıcıya ait ilan bulunamadı";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                _response.Result = _mapper.Map<List<PostDto>>(userPosts);
                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"Kullanıcının ilanları getirildi. UserId: {userId}, Toplam: {userPosts.Count}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Kullanıcı ilanları getirme hatası. UserId: {userId}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }


        [HttpPost]
        [Route("CreatePost")]
        [Authorize]
        public async Task<ResponseDto> CreatePost(PostDto postDto)
        {
            try
            {
                // Model validasyonu
                if (!ModelState.IsValid)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Geçersiz veri girişi.";
                    return _response;
                }

                // Kullanıcının var olup olmadığını kontrol et (AsNoTracking ile)
                var userExists = await _db.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == postDto.UserId);

                if (!userExists)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Kullanıcı bulunamadı.";
                    return _response;
                }

                // AutoMapper ile mapping (navigation property'ler ignore edildiği için güvenli)
                Post post = _mapper.Map<Post>(postDto);

                // Manuel olarak set edilmesi gereken alanlar
                post.PostTime = DateTime.Now;
                post.IsAdopted = false;
                post.UserId = postDto.UserId; // UserId'yi eksplisit olarak set et

                // Post'u kaydet
                _db.Posts.Add(post);
                await _db.SaveChangesAsync();

                // Resim işlemleri
                if (postDto.Image != null && postDto.Image.Length > 0)
                {
                    // Dosya validasyonu
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                    var extension = Path.GetExtension(postDto.Image.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(extension))
                    {
                        _response.IsSuccess = false;
                        _response.Message = "Geçersiz dosya formatı.";
                        return _response;
                    }

                    string fileName = post.PostId + extension;
                    string filePath = Path.Combine("wwwroot", "PostImages", fileName);
                    string fullPath = Path.Combine(Directory.GetCurrentDirectory(), filePath);

                    var directory = Path.GetDirectoryName(fullPath);
                    if (!Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }

                    using (var fileStream = new FileStream(fullPath, FileMode.Create))
                    {
                        await postDto.Image.CopyToAsync(fileStream);
                    }

                    var baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host.Value}{HttpContext.Request.PathBase.Value}";
                    post.ImageUrl = baseUrl + "/PostImages/" + fileName;
                    post.ImageLocalPath = filePath;
                }
                else
                {
                    post.ImageUrl = "https://placehold.co/600x400";
                }

                _db.Posts.Update(post);
                await _db.SaveChangesAsync();

                // Response için Post'u PostDto'ya map et (User bilgisi dahil)
                var savedPost = await _db.Posts
                    .AsNoTracking()
                    .Include(p => p.ApplicationUser)
                    .FirstOrDefaultAsync(p => p.PostId == post.PostId);

                _response.Result = _mapper.Map<PostDto>(savedPost);
                _response.IsSuccess = true;
                _response.Message = "Post başarıyla oluşturuldu.";
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.Message = ex.Message;
            }

            return _response;
        }

        [HttpPut]
        [Route("UpdatePost")]
        [Authorize]
        public async Task<ResponseDto> UpdatePost(PostDto postDto)
        {
            try
            {
                // Model validasyonu
                if (!ModelState.IsValid)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Geçersiz veri girişi.";
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    return _response;
                }

                // Post'un var olup olmadığını kontrol et
                var existingPost = await _db.Posts
                    .FirstOrDefaultAsync(p => p.PostId == postDto.PostId);

                if (existingPost == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Güncellenecek post bulunamadı.";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                // Kullanıcının var olup olmadığını kontrol et
                var userExists = await _db.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == postDto.UserId);

                if (!userExists)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Kullanıcı bulunamadı.";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                // Mevcut post'u güncelle (Navigation property'leri ignore ettiğimiz için güvenli)
                existingPost.Title = postDto.Title;
                existingPost.PetName = postDto.PetName;
                existingPost.PetType = postDto.PetType;
                existingPost.Description = postDto.Description;
                existingPost.PostLatitude = postDto.PostLatitude;
                existingPost.PostLongitude = postDto.PostLongitude;
                // IsAdopted ve PostTime güncellemiyoruz (business logic'e göre)

                // Resim güncellemesi
                if (postDto.Image != null && postDto.Image.Length > 0)
                {
                    // Dosya validasyonu
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif" };
                    var extension = Path.GetExtension(postDto.Image.FileName).ToLowerInvariant();

                    if (!allowedExtensions.Contains(extension))
                    {
                        _response.IsSuccess = false;
                        _response.Message = "Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif dosyaları kabul edilir.";
                        _response.StatusCode = HttpStatusCode.BadRequest;
                        return _response;
                    }

                    // Dosya boyutu kontrolü (5MB max)
                    if (postDto.Image.Length > 5 * 1024 * 1024)
                    {
                        _response.IsSuccess = false;
                        _response.Message = "Dosya boyutu 5MB'dan büyük olamaz.";
                        _response.StatusCode = HttpStatusCode.BadRequest;
                        return _response;
                    }

                    // Eski resmi sil
                    if (!string.IsNullOrEmpty(existingPost.ImageLocalPath))
                    {
                        var oldFilePathDirectory = Path.Combine(Directory.GetCurrentDirectory(), existingPost.ImageLocalPath);
                        FileInfo file = new FileInfo(oldFilePathDirectory);
                        if (file.Exists)
                        {
                            file.Delete();
                        }
                    }

                    // Yeni resmi kaydet
                    string fileName = existingPost.PostId + extension;
                    string filePath = Path.Combine("wwwroot", "PostImages", fileName);
                    string fullPath = Path.Combine(Directory.GetCurrentDirectory(), filePath);

                    var directory = Path.GetDirectoryName(fullPath);
                    if (!Directory.Exists(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }

                    using (var fileStream = new FileStream(fullPath, FileMode.Create))
                    {
                        await postDto.Image.CopyToAsync(fileStream);
                    }

                    var baseUrl = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host.Value}{HttpContext.Request.PathBase.Value}";
                    existingPost.ImageUrl = baseUrl + "/PostImages/" + fileName;
                    existingPost.ImageLocalPath = filePath;
                }

                _db.Posts.Update(existingPost);
                await _db.SaveChangesAsync();

                // Güncellenmiş post'u al (User bilgisi ile)
                var updatedPost = await _db.Posts
                    .AsNoTracking()
                    .Include(p => p.ApplicationUser)
                    .FirstOrDefaultAsync(p => p.PostId == existingPost.PostId);

                _response.Result = _mapper.Map<PostDto>(updatedPost);
                _response.IsSuccess = true;
                _response.Message = "Post başarıyla güncellendi.";
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"Post güncellendi. PostId: {postDto.PostId}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Post güncelleme hatası. PostId: {postDto.PostId}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }

        [HttpDelete]
        [Route("DeletePost/{id:int}")]
        [Authorize]
        public async Task<ResponseDto> DeletePost(int id)
        {
            try
            {
                // Post'un var olup olmadığını kontrol et
                var post = await _db.Posts
                    .FirstOrDefaultAsync(p => p.PostId == id);

                if (post == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Silinecek post bulunamadı.";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                // İlişkili AdoptionRequest'lerin var olup olmadığını kontrol et
                var hasAdoptionRequests = await _db.AdoptionRequests
                    .AnyAsync(ar => ar.PostId == id);

                if (hasAdoptionRequests)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Bu posta ait sahiplenme talepleri bulunduğu için silinemez.";
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    return _response;
                }

                // Post'un resmini sil
                if (!string.IsNullOrEmpty(post.ImageLocalPath))
                {
                    var oldFilePathDirectory = Path.Combine(Directory.GetCurrentDirectory(), post.ImageLocalPath);
                    FileInfo file = new FileInfo(oldFilePathDirectory);
                    if (file.Exists)
                    {
                        try
                        {
                            file.Delete();
                            _logger.LogInformation($"Post resmi silindi: {oldFilePathDirectory}");
                        }
                        catch (Exception fileEx)
                        {
                            _logger.LogWarning(fileEx, $"Post resmi silinemedi: {oldFilePathDirectory}");
                            // Dosya silinmese de post'u silebiliriz
                        }
                    }
                }

                // Post'u sil
                _db.Posts.Remove(post);
                await _db.SaveChangesAsync();

                _response.IsSuccess = true;
                _response.Message = "Post başarıyla silindi.";
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"Post silindi. PostId: {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Post silme hatası. PostId: {id}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }

        [HttpPost]
        [Route("AdoptPost/{id:int}")]
        [Authorize]
        public async Task<ResponseDto> AdoptPost(int id)
        {
            try
            {
                // Post'un var olup olmadığını kontrol et
                var post = await _db.Posts
                    .FirstOrDefaultAsync(p => p.PostId == id);

                if (post == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Sahiplenilecek post bulunamadı.";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                // Zaten sahiplenilmiş mi kontrol et
                if (post.IsAdopted)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Bu ilan zaten sahiplenilmiş.";
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    return _response;
                }

                // Sahiplenme durumunu güncelle
                post.IsAdopted = true;
                await _db.SaveChangesAsync();

                // Güncellenmiş post'u döndür
                var updatedPost = await _db.Posts
                    .AsNoTracking()
                    .Include(p => p.ApplicationUser)
                    .FirstOrDefaultAsync(p => p.PostId == id);

                _response.Result = _mapper.Map<PostDto>(updatedPost);
                _response.IsSuccess = true;
                _response.Message = $"'{post.PetName}' isimli hayvan başarıyla sahiplenildi!";
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"Post sahiplenildi. PostId: {id}, PetName: {post.PetName}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Post sahiplendirme hatası. PostId: {id}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }

        // Bonus: Sahiplenmeyi iptal etme metodu (isteğe bağlı)
        [HttpPost]
        [Route("CancelAdoption/{id:int}")]
        [Authorize]
        public async Task<ResponseDto> CancelAdoption(int id)
        {
            try
            {
                var post = await _db.Posts
                    .FirstOrDefaultAsync(p => p.PostId == id);

                if (post == null)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Post bulunamadı.";
                    _response.StatusCode = HttpStatusCode.NotFound;
                    return _response;
                }

                if (!post.IsAdopted)
                {
                    _response.IsSuccess = false;
                    _response.Message = "Bu ilan zaten sahiplenilmemiş durumda.";
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    return _response;
                }

                post.IsAdopted = false;
                await _db.SaveChangesAsync();

                var updatedPost = await _db.Posts
                    .AsNoTracking()
                    .Include(p => p.ApplicationUser)
                    .FirstOrDefaultAsync(p => p.PostId == id);

                _response.Result = _mapper.Map<PostDto>(updatedPost);
                _response.IsSuccess = true;
                _response.Message = $"'{post.PetName}' isimli hayvanın sahiplenme durumu iptal edildi.";
                _response.StatusCode = HttpStatusCode.OK;
                _logger.LogInformation($"Post sahiplenme durumu iptal edildi. PostId: {id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Sahiplenme iptal hatası. PostId: {id}, Hata: {ex.Message}");
                _response.IsSuccess = false;
                _response.Message = ex.Message;
                _response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return _response;
        }
    }
}