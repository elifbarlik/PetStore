using AutoMapper;
using PetStoreAPI.Models;
using PetStoreAPI.Models.Dto;
using System.ComponentModel.DataAnnotations.Schema;

namespace PetStoreAPI.Configurations
{
    public class MappingConfig
    {
        public static MapperConfiguration RegisterMaps()
        {
            var mappingConfig = new MapperConfiguration(config =>
            {
                // Users Mapping
                config.CreateMap<UsersDto, ApplicationUser>()
                    .ForMember(dest => dest.UserName, u => u.MapFrom(src => src.UserName))
                    .ForMember(dest => dest.Name, u => u.MapFrom(src => src.Name))
                    .ForMember(dest => dest.Surname, u => u.MapFrom(src => src.Surname))
                    .ForMember(dest => dest.Email, u => u.MapFrom(src => src.Email))
                    .ForMember(dest => dest.Posts, opt => opt.Ignore()) // Posts listesini ignore et
                    .ReverseMap();

                // UserDto to ApplicationUser mapping
                config.CreateMap<UserDto, ApplicationUser>()
                    .ForMember(dest => dest.Posts, opt => opt.Ignore()) // Posts listesini ignore et
                    .ReverseMap()
                    .ForMember(dest => dest.Posts, opt => opt.Ignore()); // Posts listesini ignore et

                // Post Mapping - EN ÖNEMLİ KISIM
                config.CreateMap<PostDto, Post>()
                    .ForMember(dest => dest.ApplicationUser, opt => opt.Ignore()) // Navigation property'yi ignore et
                    .ForMember(dest => dest.AdoptionRequests, opt => opt.Ignore()) // Collection'ı ignore et
                    .ForMember(dest => dest.PostId, opt => opt.Ignore()) // PostId'yi ignore et (DB tarafından set edilecek)
                    .ForMember(dest => dest.PostTime, opt => opt.Ignore()) // PostTime'ı ignore et (kodda set edilecek)
                    .ForMember(dest => dest.IsAdopted, opt => opt.Ignore()) // IsAdopted'ı ignore et (kodda set edilecek)
                    .ForMember(dest => dest.ImageUrl, opt => opt.Ignore()) // ImageUrl'i ignore et (kodda set edilecek)
                    .ForMember(dest => dest.ImageLocalPath, opt => opt.Ignore()); // ImageLocalPath'i ignore et

                config.CreateMap<Post, PostDto>()
                    .ForMember(dest => dest.User, opt => opt.MapFrom(src => src.ApplicationUser))
                    .ForMember(dest => dest.Image, opt => opt.Ignore()); // IFormFile'ı ignore et

                // AdoptionRequest Mapping
                config.CreateMap<AdoptionRequestDto, AdoptionRequest>()
                    .ForMember(dest => dest.RequesterUser, opt => opt.Ignore()) // Navigation property'yi ignore et
                    .ForMember(dest => dest.Post, opt => opt.Ignore()) // Navigation property'yi ignore et
                    .ReverseMap()
                    .ForMember(dest => dest.RequesterUser, opt => opt.MapFrom(src => src.RequesterUser));


            });
            return mappingConfig;
        }
    }
}