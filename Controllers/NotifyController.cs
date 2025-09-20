using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using MonkeyAssenbly.Models;
namespace MonkeyAssenbly.Controllers
{
    public class NotifyController : BaseController
    {
        // GET: Notify
        public ActionResult Notify()
        {
            return View();
        }

        // GET: Notify/Details/5
        public ActionResult Details(int id)
        {
            return View();
        }

        // GET: Notify/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Notify/Create
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

        // GET: Notify/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: Notify/Edit/5
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

        // GET: Notify/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: Notify/Delete/5
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
