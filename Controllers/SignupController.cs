using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System;
using System.Globalization;

namespace MonkeyAssenbly.Controllers
{
    public class SignupController : Controller
    {
        private readonly string _connectionString;

        public SignupController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: Signup Page
        [HttpGet]
        public IActionResult Signup()
        {
            return View();
        }

        // POST: Signup Process
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Signup(
            string username,
            string password,
            string firstName,
            string lastName,
            string gender,
            string birthdate,
            string email,
            string avatarUrl,
            string bio)
        {
            try
            {
                Console.WriteLine($"[DEBUG] Username: {username}, Birthdate(raw): {birthdate}");

                // ---------- Force Gregorian Calendar ----------
                var cultureInfo = new CultureInfo("en-US");
                cultureInfo.DateTimeFormat.Calendar = new GregorianCalendar();
                CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
                CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

                // ---------- ตรวจสอบข้อมูลที่กรอก ----------
                if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password) ||
                    string.IsNullOrEmpty(firstName) || string.IsNullOrEmpty(lastName) ||
                    string.IsNullOrEmpty(gender) || string.IsNullOrEmpty(birthdate) ||
                    string.IsNullOrEmpty(email))
                {
                    ViewBag.Error = "กรุณากรอกข้อมูลให้ครบถ้วน";
                    return View();
                }

                // ---------- Parse Birthdate ----------
                if (!DateTime.TryParseExact(birthdate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedBirthdate))
                {
                    ViewBag.Error = "รูปแบบวันเกิดไม่ถูกต้อง";
                    return View();
                }

                Console.WriteLine($"[DEBUG] Final Birthdate: {parsedBirthdate} (Year = {parsedBirthdate.Year})");

                using var conn = new NpgsqlConnection(_connectionString);
                conn.Open();

                using var tran = conn.BeginTransaction();

                // ---------- 1) Insert to AccountTable ----------
                var insertAccountSql = @"
                    INSERT INTO ""AccountTable"" (username, passwd)
                    VALUES (@username, @passwd)
                    RETURNING account_id;";

                using var accountCmd = new NpgsqlCommand(insertAccountSql, conn, tran);
                accountCmd.Parameters.AddWithValue("username", username);
                accountCmd.Parameters.AddWithValue("passwd", password);

                var accountId = (int)accountCmd.ExecuteScalar();
                Console.WriteLine($"[DEBUG] Created Account with ID: {accountId}");

                // ---------- 2) Insert to UserDetailTable ----------
                var insertUserSql = @"
                    INSERT INTO ""UserDetailTable"" 
                    (user_firstname, user_lastname, user_gender, user_birthdate, user_email, account_id, user_avatar, bio)
                    VALUES (@firstName, @lastName, @gender, @birthdate, @userEmail, @accountId, @avatarUrl, @bio);";

                using var userCmd = new NpgsqlCommand(insertUserSql, conn, tran);
                userCmd.Parameters.AddWithValue("firstName", firstName);
                userCmd.Parameters.AddWithValue("lastName", lastName);
                userCmd.Parameters.AddWithValue("gender", gender);

                // ✅ ส่งแบบระบุชนิดเป็น DATE โดยตรง
                userCmd.Parameters.AddWithValue("birthdate", NpgsqlTypes.NpgsqlDbType.Date, parsedBirthdate);

                userCmd.Parameters.AddWithValue("userEmail", email);
                userCmd.Parameters.AddWithValue("accountId", accountId);
                userCmd.Parameters.AddWithValue("avatarUrl", string.IsNullOrEmpty(avatarUrl) ? "/uploads/default-avatar.png" : avatarUrl);
                userCmd.Parameters.AddWithValue("bio", string.IsNullOrEmpty(bio) ? "" : bio);

                userCmd.ExecuteNonQuery();

                tran.Commit();

                Console.WriteLine($"[DEBUG] Signup success for username: {username}");

                // เสร็จสิ้น redirect ไปหน้า Login
                return RedirectToAction("Login", "Login");
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] " + ex.Message);
                ViewBag.Error = "เกิดข้อผิดพลาด: " + ex.Message;
                return View();
            }
        }
    }
}
