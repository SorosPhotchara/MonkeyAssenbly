using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System;
using System.Globalization;
using MonkeyAssenbly.Models;

namespace MonkeyAssenbly.Controllers
{
    public class SignupController : Controller
    {
        private readonly string _connectionString;

        public SignupController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult Signup()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult SignupSubmit(SignupModel model)
        {
            try
            {
                Console.WriteLine($"[DEBUG] Username: {model.Username}, Birthdate(raw): {model.Birthdate}");

                // ---------- Force Gregorian Calendar ----------
                var cultureInfo = new CultureInfo("en-US");
                cultureInfo.DateTimeFormat.Calendar = new GregorianCalendar();
                CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
                CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

                // ---------- ตรวจสอบข้อมูล ----------
                if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Password) ||
                    string.IsNullOrEmpty(model.FirstName) || string.IsNullOrEmpty(model.LastName) ||
                    string.IsNullOrEmpty(model.Gender) || string.IsNullOrEmpty(model.Birthdate) ||
                    string.IsNullOrEmpty(model.Email))
                {
                    ViewBag.Error = "กรุณากรอกข้อมูลให้ครบถ้วน";
                    return View(model);
                }

                // ---------- Parse Birthdate ----------
                if (!DateTime.TryParseExact(model.Birthdate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedBirthdate))
                {
                    ViewBag.Error = "รูปแบบวันเกิดไม่ถูกต้อง";
                    return View(model);
                }

                using var conn = new NpgsqlConnection(_connectionString);
                conn.Open();
                using var tran = conn.BeginTransaction();

                // ---------- 1) Insert to AccountTable ----------
                var insertAccountSql = @"
                    INSERT INTO ""AccountTable"" (username, passwd)
                    VALUES (@username, @passwd)
                    RETURNING account_id;";

                using var accountCmd = new NpgsqlCommand(insertAccountSql, conn, tran);
                accountCmd.Parameters.AddWithValue("username", model.Username);
                accountCmd.Parameters.AddWithValue("passwd", model.Password);

                var accountId = (int)accountCmd.ExecuteScalar();

                // ---------- 2) Insert to UserDetailTable ----------
                var insertUserSql = @"
                    INSERT INTO ""UserDetailTable"" 
                    (user_firstname, user_lastname, user_gender, user_birthdate, user_email, account_id, user_avatar, bio)
                    VALUES (@firstName, @lastName, @gender, @birthdate, @userEmail, @accountId, @avatarUrl, @bio);";

                using var userCmd = new NpgsqlCommand(insertUserSql, conn, tran);
                userCmd.Parameters.AddWithValue("firstName", model.FirstName);
                userCmd.Parameters.AddWithValue("lastName", model.LastName);
                userCmd.Parameters.AddWithValue("gender", model.Gender);
                userCmd.Parameters.AddWithValue("birthdate", NpgsqlTypes.NpgsqlDbType.Date, parsedBirthdate);
                userCmd.Parameters.AddWithValue("userEmail", model.Email);
                userCmd.Parameters.AddWithValue("accountId", accountId);
                userCmd.Parameters.AddWithValue("avatarUrl", string.IsNullOrEmpty(model.AvatarUrl) ? "/uploads/default-avatar.png" : model.AvatarUrl);
                userCmd.Parameters.AddWithValue("bio", string.IsNullOrEmpty(model.Bio) ? "" : model.Bio);

                userCmd.ExecuteNonQuery();
                tran.Commit();

                return RedirectToAction("Login", "Login");
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] " + ex.Message);
                ViewBag.Error = "เกิดข้อผิดพลาด: " + ex.Message;
                return View(model);
            }
        }
    }
}
