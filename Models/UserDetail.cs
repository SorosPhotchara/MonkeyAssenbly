using System;

namespace MonkeyAssenbly.Models
{
    public class UserDetail
    {
        public int UserId { get; set; }
        public string UserFirstname { get; set; }
        public string UserLastname { get; set; }
        public string UserEmail { get; set; }

        // ถ้ามี gender, birthdate, account
        public string? UserGender { get; set; }
        public DateTime? UserBirthdate { get; set; }
        public int? AccountId { get; set; }

        // เพิ่มใหม่
        public string? Bio { get; set; }
        public string? UserAvatar { get; set; }

        // สำหรับ follow
        public int Followers { get; set; }
        public int Following { get; set; }
        public bool IsFollowing { get; set; }
    }
}
