using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MonkeyAssenbly.Controllers
{
    public class SignupController : BaseController
    {
        // GET: SignupController
        public ActionResult Index()
        {
            return View();
        }

        // GET: SignupController/Details/5
        public ActionResult Details(int id)
        {
            return View();
        }

        // GET: SignupController/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: SignupController/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }

        // GET: SignupController/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: SignupController/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(int id, IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }

        // GET: SignupController/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: SignupController/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Delete(int id, IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }
    }
}
