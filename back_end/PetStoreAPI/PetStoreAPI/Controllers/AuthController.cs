using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PetStoreAPI.Controllers
{
    [Route("api/auth/firebase")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        [HttpPost("custom-token")]
        [Authorize]
        public async Task<IActionResult> CreateFirebaseCustomToken()
        {
            if (FirebaseAuth.DefaultInstance == null)
            {
                return StatusCode(500, new { message = "Firebase is not initialized on the server. Please configure service account credentials." });
            }
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                         User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { message = "User id not found in token" });
            }

            try
            {
                var customToken = await FirebaseAuth.DefaultInstance.CreateCustomTokenAsync(userId);
                return Ok(new { token = customToken });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to create Firebase custom token", error = ex.Message });
            }
        }
    }
}


