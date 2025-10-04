namespace MonkeyAssenbly.Models
{
    public class PostUpdateDto
    {
        public string eventName { get; set; }
        public string description { get; set; }
        public string location { get; set; }
        public string dateOpen { get; set; }
        public string dateClose { get; set; }
        public string startTime { get; set; }
        public string endTime { get; set; }
        public int maxParticipants { get; set; }
        public bool status { get; set; }
    }
}
