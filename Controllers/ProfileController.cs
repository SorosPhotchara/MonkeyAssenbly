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

            ViewBag.FirstName = HttpContext.Session.GetString("FirstName");
            ViewBag.LastName = HttpContext.Session.GetString("LastName");
            ViewBag.Email = HttpContext.Session.GetString("Email");

            return View();
        }

        // GET: /Profile/GetProfile
        [HttpGet]
        public IActionResult GetProfile()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if(userId == null) return Unauthorized();

            UserDetail user;
            using(var conn = new NpgsqlConnection(_connectionString))
            {
                conn.Open();
                var cmd = new NpgsqlCommand(
                    @"SELECT user_firstname, user_lastname, user_email, user_gender, user_birthdate, account_id, bio, user_avatar
                      FROM ""UserDetailTable"" 
                      WHERE user_id = @id", conn);
                cmd.Parameters.AddWithValue("id", userId.Value);

                using var reader = cmd.ExecuteReader();
                if(!reader.Read()) return NotFound();

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
                    UserAvatar = reader.IsDBNull(7) ? "/uploads/default-avatar.png" : reader.GetString(7),
                    Followers = 0,
                    Following = 0,
                    IsFollowing = false
                };
            }

            return Json(new {
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
        [HttpPost]
        public IActionResult UpdateProfile([FromBody] UpdateProfileRequest model)
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();

            var sql = @"UPDATE ""UserDetailTable"" 
                        SET user_firstname = @firstname, 
                            bio = @bio,
                            user_avatar = @avatar
                        WHERE user_id = @userId";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("firstname", model.Username);
            cmd.Parameters.AddWithValue("bio", model.Bio ?? "");
            cmd.Parameters.AddWithValue("avatar", model.AvatarUrl ?? "");
            cmd.Parameters.AddWithValue("userId", userId.Value);

            var rows = cmd.ExecuteNonQuery();
            if (rows == 0) return BadRequest(new { message = "Update failed" });

            return Json(new
            {
                username = model.Username,
                bio = model.Bio,
                avatar = model.AvatarUrl
            });
        }

        public class UpdateProfileRequest
        {
            public string Username { get; set; }
            public string Bio { get; set; }
            public string AvatarUrl { get; set; }
        }
    }
}
