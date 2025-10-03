using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using MonkeyAssenbly.Models;
using Microsoft.Extensions.Configuration;

namespace MonkeyAssenbly.Controllers
{
    public class ProfileController : Controller
    {
        private readonly string _connectionString;

        public ProfileController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public IActionResult Profile()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null) return RedirectToAction("Login", "Login");

            UserDetail user;
            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                var cmd = new NpgsqlCommand(
                    @"SELECT user_firstname, user_lastname, user_email, bio, user_avatar
                    FROM ""UserDetailTable""
                    WHERE user_id = @id", conn);
                cmd.Parameters.AddWithValue("id", userId.Value);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return NotFound();

                user = new UserDetail
                {
                    UserId = userId.Value,
                    UserFirstname = reader.GetString(0),
                    UserLastname = reader.GetString(1),
                    UserEmail = reader.GetString(2),
                    Bio = reader.IsDBNull(3) ? "" : reader.GetString(3),
                    UserAvatar = reader.IsDBNull(4) ? null : reader.GetString(4),
                    Followers = 0,
                    Following = 0,
                    IsFollowing = false
                };
            }

            var model = new ProfileModel
            {
                UserId = user.UserId,
                FirstName = user.UserFirstname,
                LastName = user.UserLastname,
                Email = user.UserEmail,
                Bio = user.Bio,
                AvatarUrl = user.UserAvatar,
                Followers = user.Followers,
                Following = user.Following,
                IsFollowing = user.IsFollowing
            };

            return View(model); // ส่ง model ไปยัง View
        }



        // ---------------- ตรวจสอบสถานะ Login ----------------
        [HttpGet]
        public IActionResult CheckLoginStatus()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Json(new { isLoggedIn = false });
            }

            var firstName = HttpContext.Session.GetString("FirstName");
            var lastName = HttpContext.Session.GetString("LastName");

            return Json(new
            {
                isLoggedIn = true,
                username = $"{firstName} {lastName}"
            });
        }

        // ---------------- ดึงข้อมูลโปรไฟล์ ----------------
        [HttpGet]
        public IActionResult GetProfile()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null) return Unauthorized();

            UserDetail user;
            using (var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                var cmd = new NpgsqlCommand(
                    @"SELECT user_firstname, user_lastname, user_email, user_gender, user_birthdate, account_id, bio, user_avatar
                      FROM ""UserDetailTable"" 
                      WHERE user_id = @id", conn);
                cmd.Parameters.AddWithValue("id", userId.Value);

                using var reader = cmd.ExecuteReader();
                if (!reader.Read()) return NotFound();

                user = new UserDetail
                {
                    UserId = userId.Value,
                    UserFirstname = reader.GetString(0),
                    UserLastname = reader.GetString(1),
                    UserEmail = reader.GetString(2),
                    UserGender = reader.GetString(3),
                    UserBirthdate = reader.GetDateTime(4),
                    AccountId = reader.GetInt32(5),
                    Bio = reader.IsDBNull(6) ? "" : reader.GetString(6),
                    UserAvatar = reader.IsDBNull(7) ? null : reader.GetString(7),
                    Followers = 0,
                    Following = 0,
                    IsFollowing = false
                };
            }

            return Json(new
            {
                userId = user.UserId,
                username = $"{user.UserFirstname} {user.UserLastname}",
                email = user.UserEmail,
                bio = user.Bio,
                avatar = user.UserAvatar,
                followers = user.Followers,
                following = user.Following,
                isFollowing = user.IsFollowing
            });
        }

        // ---------------- แก้ไขโปรไฟล์ ----------------
        [HttpPost]
        public IActionResult UpdateProfile([FromBody] UpdateProfileRequest model)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            var sql = @"UPDATE ""UserDetailTable"" 
                        SET user_firstname = @firstname, 
                            user_lastname = @lastname, 
                            bio = @bio,
                            user_avatar = @avatar
                        WHERE user_id = @userId";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("firstname", model.FirstName);
            cmd.Parameters.AddWithValue("lastname", model.LastName);
            cmd.Parameters.AddWithValue("bio", model.Bio ?? "");
            cmd.Parameters.AddWithValue("avatar", model.AvatarUrl ?? "");
            cmd.Parameters.AddWithValue("userId", userId.Value);

            var rows = cmd.ExecuteNonQuery();
            if (rows == 0) return BadRequest(new { message = "Update failed" });

            return Json(new
            {
                username = $"{model.FirstName} {model.LastName}",
                bio = model.Bio,
                avatar = model.AvatarUrl
            });
        }

        // ---------------- Model สำหรับรับข้อมูล ----------------
        public class UpdateProfileRequest
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Bio { get; set; }
            public string AvatarUrl { get; set; }
        }
    }
}
