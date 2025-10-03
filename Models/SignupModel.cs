namespace MonkeyAssenbly.Models
{
    public class SignupModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Gender { get; set; }
        public string Birthdate { get; set; }   // เก็บเป็น string ก่อน parse ทีหลัง
        public string Email { get; set; }
        public string AvatarUrl { get; set; }
        public string Bio { get; set; }
    }
}
