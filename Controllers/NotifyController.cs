using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using MonkeyAssenbly.Models;
// using Npgsql; // ไม่ต้องใช้ถ้า mock ข้อมูล

namespace MonkeyAssenbly.Controllers
{
    public class NotifyController : BaseController
    {
        private readonly string _connectionString;

        public NotifyController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

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

        // GET: /Notify/Latest
        /// <summary>
        /// ส่ง mock ข้อมูลแจ้งเตือนล่าสุด (ไม่ดึงจาก database)
        /// </summary>
        [HttpGet]
        public IActionResult Latest()
        {
            // สร้าง mock ข้อมูลแจ้งเตือน
            var notifications = new List<object>
            {
                new {
                    type = "comment",
                    message = "คุณ A คอมเมนต์ในโพสต์ 'เที่ยวเชียงใหม่'",
                    time = "09:01"
                },
                new {
                    type = "join",
                    message = "คุณ B เข้าร่วมโพสต์ 'เที่ยวเชียงใหม่'",
                    time = "09:00"
                },
                new {
                    type = "full",
                    message = "โพสต์ 'เที่ยวเชียงใหม่' มีผู้เข้าร่วมครบแล้ว",
                    time = "08:59"
                }
            };

            // ส่งข้อมูล mock กลับไปเป็น JSON
            return Json(notifications);
        }
    }
}
