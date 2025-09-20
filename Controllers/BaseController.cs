using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace MonkeyAssenbly.Controllers
{
    public class BaseController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            ViewBag.HomeUrl = Url.Action("Home", "Home");
            ViewBag.TagsUrl = Url.Action("Tags", "Tags");
            ViewBag.NotifyUrl = Url.Action("Notify", "Notify");
            ViewBag.ProfileUrl = Url.Action("Profile", "Profile");

            base.OnActionExecuting(filterContext);
        }
    }
}