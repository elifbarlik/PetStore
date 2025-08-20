
using AutoMapper;
using MailKit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PetStoreAPI.Data;
using PetStoreAPI.Extensions;
using PetStoreAPI.Models;
using PetStoreAPI.Service;
using PetStoreAPI.Service.IService;
using PetStoreAPI.Configurations;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog'u Seq ile yap�land�r
builder.Host.UseSerilog((hostingContext, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(hostingContext.Configuration) // appsettings.json'dan okur
        .Enrich.FromLogContext()
        .WriteTo.Seq("http://localhost:5341"); // Seq sunucusunun URL'si
});

// Di�er servis kay�tlar�
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
IMapper mapper = MappingConfig.RegisterMaps().CreateMapper();
builder.Services.AddSingleton(mapper);

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("ApiSettings:JwtOptions"));
// Add services to the container.
builder.Services.AddIdentity<ApplicationUser, IdentityRole>().AddEntityFrameworkStores<AppDbContext>().AddDefaultTokenProviders();
builder.Services.AddControllers();


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
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
        // NOT: AllowCredentials() kullanmay�n AllowAnyOrigin() ile birlikte
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
            app.Logger.LogError("Firebase credentials not found. Provide a valid credentials file via FIREBASE_CREDENTIALS_JSON/GOOGLE_APPLICATION_CREDENTIALS env vars, place 'firebase-service-account.json' in the content root, or set 'Firebase:CredentialsPath' in appsettings.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to initialize Firebase Admin SDK. Check credentials file and path.");
    }
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();

app.MapControllers();
app.Run();
