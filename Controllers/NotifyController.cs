using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Threading.Tasks;
using MonkeyAssenbly.Models;
using Npgsql; // เพิ่มบรรทัดนี้

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
        public async Task<IActionResult> Latest()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized();
            }

            var notifications = new List<object>();
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // เพิ่ม notification_id ใน SELECT
            var sql = @"SELECT notification_id, type, message, created_at
                        FROM ""NotificationTable""
                        WHERE user_id = @user_id
                        ORDER BY created_at DESC
                        LIMIT 20";
            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@user_id", userId.Value);
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                notifications.Add(new
                {
                    notification_id = reader.GetInt32(0), // index 0 คือ notification_id
                    type = reader.GetString(1),
                    message = reader.GetString(2),
                    time = reader.GetDateTime(3).ToString("HH:mm")
                });
            }
            return Json(notifications);
        }

        /// <summary>
        /// ฟังก์ชันสำหรับบันทึกแจ้งเตือนใหม่ลง database
        /// </summary>
        private async Task AddNotificationAsync(string type, string message, int? userId, int? postId)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();
            var sql = @"INSERT INTO ""NotificationTable"" (type, message, user_id, post_id, created_at)
                        VALUES (@type, @message, @user_id, @post_id, NOW())";
            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@message", message);
            cmd.Parameters.AddWithValue("@user_id", (object?)userId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@post_id", (object?)postId ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }
    }
}
