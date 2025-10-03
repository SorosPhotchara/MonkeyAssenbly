using Microsoft.AspNetCore.Mvc;

namespace MonkeyAssenbly.Controllers
{
    public class DetailHostController : BaseController
    {
        public IActionResult DetailHost()
        {
            return View();
        }
    }
}
