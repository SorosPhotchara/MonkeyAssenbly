namespace MonkeyAssenbly.Models
{
    public class ProfileModel
    {
        public int UserId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Bio { get; set; }
        public string AvatarUrl { get; set; }
        public int Followers { get; set; }
        public int Following { get; set; }
        public bool IsFollowing { get; set; }
    }
}
