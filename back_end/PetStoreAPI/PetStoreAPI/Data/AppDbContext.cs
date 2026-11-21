using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PetStoreAPI.Models;

namespace PetStoreAPI.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<ApplicationUser> ApplicationUsers { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<AdoptionRequest> AdoptionRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Timestamps are stored in UTC. SQL Server datetime2 has no kind, so mark values
            // read back as UTC; JSON then carries a trailing "Z" and every client converts
            // correctly to its own time zone. (Value converter only: no schema change.)
            var utc = new ValueConverter<DateTime, DateTime>(
                v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
                v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            modelBuilder.Entity<Post>().Property(p => p.PostTime).HasConversion(utc);
            modelBuilder.Entity<AdoptionRequest>().Property(r => r.RequestDate).HasConversion(utc);
        }
    }
}
