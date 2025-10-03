namespace MonkeyAssenbly.Models
{
    public class PostModel
    {
        public class Post
        {
            public int PostId { get; set; }
            public string? PostTitile { get; set; }
            public string? PostDescript { get; set; }
            public int PostOwnerId { get; set; }
            public bool PostStatus { get; set; }
            public string? PostPlace { get; set; }
            public string? PostTimeOpen { get; set; }
            public string? PostTimeClose { get; set; }
            public DateTime PostDateOpen { get; set; }
            public DateTime PostDateClose { get; set; }
            public int PostMaxPaticipants { get; set; }
            public int PostCurrentPaticipants { get; set; }
        }

    }
}
