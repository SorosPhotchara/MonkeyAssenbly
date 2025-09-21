using System;

namespace MonkeyAssenbly.Models
{
    public class UserDetail
    {
        public int UserId { get; set; }
        public string UserFirstname { get; set; }
        public string UserLastname { get; set; }
        public string UserGender { get; set; }
        public DateTime UserBirthdate { get; set; }
        public string UserEmail { get; set; }
        public int? AccountId { get; set; }
    }
}
