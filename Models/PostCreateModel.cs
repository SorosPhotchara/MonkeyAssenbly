namespace MonkeyAssenbly.Models
{
    public class PostCreateModel
    {
        public string? postTitile { get; set; }
        public string? postDescript { get; set; }
        public string? postPlace { get; set; }
        public string? postDateOpen { get; set; }
        public string? postDateClose { get; set; }
        public string? postTimeOpen { get; set; }
        public string? postTimeClose { get; set; }
        public int? postMaxPaticipants { get; set; }
        public string? tagName { get; set; }
        public int? tagId { get; set; }
    }
}
