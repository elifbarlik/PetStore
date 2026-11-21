namespace PetStoreAPI.Helpers
{
    /// <summary>
    /// Validates uploaded post images by extension, size AND file signature (magic bytes),
    /// so a renamed non-image file cannot be stored and served as an image.
    /// </summary>
    public static class ImageFileValidator
    {
        public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

        private static readonly Dictionary<string, byte[][]> Signatures = new()
        {
            [".jpg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".jpeg"] = new[] { new byte[] { 0xFF, 0xD8, 0xFF } },
            [".png"] = new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } },
            [".gif"] = new[] { "GIF87a"u8.ToArray(), "GIF89a"u8.ToArray() },
        };

        /// <summary>Returns null when the file is valid, otherwise a user-facing error message.</summary>
        public static string? Validate(IFormFile file, out string extension)
        {
            extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!Signatures.TryGetValue(extension, out var allowedSignatures))
                return "Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif dosyaları kabul edilir.";

            if (file.Length > MaxFileSizeBytes)
                return "Dosya boyutu 5MB'dan büyük olamaz.";

            var maxLength = allowedSignatures.Max(s => s.Length);
            var header = new byte[maxLength];
            using (var stream = file.OpenReadStream())
            {
                var read = 0;
                while (read < maxLength)
                {
                    var n = stream.Read(header, read, maxLength - read);
                    if (n == 0) break;
                    read += n;
                }
                if (!allowedSignatures.Any(sig => read >= sig.Length && header.AsSpan(0, sig.Length).SequenceEqual(sig)))
                    return "Dosya içeriği bir resim değil.";
            }

            return null;
        }
    }
}
