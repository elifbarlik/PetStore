using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PetStoreAPI.Data;
using PetStoreAPI.Extensions;
using PetStoreAPI.Models;
using PetStoreAPI.Service;
using PetStoreAPI.Service.IService;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog: console + Seq (URL configurable via "Seq:ServerUrl")
builder.Host.UseSerilog((hostingContext, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(hostingContext.Configuration)
        .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.Seq(hostingContext.Configuration["Seq:ServerUrl"] ?? "http://localhost:5341");
});

// Diğer servis kayıtları
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("ApiSettings:JwtOptions"));
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.User.RequireUniqueEmail = true;
        // Brute-force protection for /api/user/Login
        options.Lockout.AllowedForNewUsers = true;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Validation errors use the same ResponseDto envelope as every other response,
        // with a readable message and the per-field errors in "result".
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    e => e.Key,
                    e => e.Value!.Errors.Select(x => string.IsNullOrEmpty(x.ErrorMessage) ? "Geçersiz değer." : x.ErrorMessage).ToArray());

            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new PetStoreAPI.Models.Dto.ResponseDto
            {
                IsSuccess = false,
                StatusCode = System.Net.HttpStatusCode.BadRequest,
                Message = string.Join(" ", errors.SelectMany(e => e.Value).Distinct()),
                Result = errors,
            });
        };
    });


builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(option =>
{
    option.AddSecurityDefinition(name: JwtBearerDefaults.AuthenticationScheme, securityScheme: new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter the Bearer Authorization string as following: 'Bearer Generated-JWT-Token'",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = JwtBearerDefaults.AuthenticationScheme
                }
            },new string[] { }
        }
    });
});
builder.AddAppAuthetication();
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
        // NOT: AllowCredentials() AllowAnyOrigin() ile birlikte kullanılamaz
    });
});
var app = builder.Build();

// Initialize Firebase Admin SDK if not already initialized
var firebaseCredentialsPath = Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_JSON");
var googleApplicationCredentialsPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");
var configuredCredentialsPath = app.Configuration["Firebase:CredentialsPath"];

if (FirebaseApp.DefaultInstance == null)
{
    string? resolvedPath = null;

    // Build candidate list in priority order
    var candidates = new List<string?>
    {
        firebaseCredentialsPath,
        googleApplicationCredentialsPath,
        // If configured path is relative, make it relative to content root
        !string.IsNullOrWhiteSpace(configuredCredentialsPath)
            ? (Path.IsPathRooted(configuredCredentialsPath)
                ? configuredCredentialsPath
                : Path.Combine(app.Environment.ContentRootPath, configuredCredentialsPath))
            : null,
        // Fallback to file in content root (if copied to output)
        Path.Combine(app.Environment.ContentRootPath, "firebase-service-account.json"),
        // Fallback to build output directory where content files are copied
        Path.Combine(AppContext.BaseDirectory, "firebase-service-account.json"),
        // Fallback to repo root (one level up during dev)
        Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "firebase-service-account.json"))
    };

    foreach (var candidate in candidates)
    {
        if (!string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
        {
            resolvedPath = candidate;
            break;
        }
    }

    try
    {
        if (!string.IsNullOrWhiteSpace(resolvedPath))
        {
            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(resolvedPath)
            });
            app.Logger.LogInformation("Firebase Admin initialized using credentials file at {Path}", resolvedPath);
        }
        else
        {
            app.Logger.LogWarning("Firebase credentials not found (chat features disabled). Provide a valid credentials file via FIREBASE_CREDENTIALS_JSON/GOOGLE_APPLICATION_CREDENTIALS env vars, place 'firebase-service-account.json' in the content root, or set 'Firebase:CredentialsPath' in appsettings.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to initialize Firebase Admin SDK. Check credentials file and path.");
    }
}

// Unhandled exceptions: log once and return the standard envelope (no stack trace leak)
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
    app.Logger.LogError(feature?.Error, "Beklenmeyen hata: {Path}", context.Request.Path);
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new PetStoreAPI.Models.Dto.ResponseDto
    {
        IsSuccess = false,
        StatusCode = System.Net.HttpStatusCode.InternalServerError,
        Message = "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    });
}));

app.UseSwagger();
app.UseSwaggerUI();

// Redirect to HTTPS only when an HTTPS endpoint is actually configured
if ((app.Configuration["urls"] ?? string.Empty).Contains("https://", StringComparison.OrdinalIgnoreCase))
    app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();

app.MapControllers();
app.Run();
