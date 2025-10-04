using Microsoft.AspNetCore.Mvc;

namespace MonkeyAssenbly.Controllers
{
    public class DetailHostController : BaseController
    {
        [HttpGet("DetailHost/{postId}")]
        public IActionResult DetailHost(int postId)
        {
            ViewBag.PostId = postId; 
            return View(postId);
        }



    }
}
