        
        
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using MonkeyAssenbly.Models;
using Microsoft.Extensions.Configuration;

namespace MonkeyAssenbly.Controllers
{
    [Route("[controller]/[action]")]
    public class ProfileController : BaseController
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
                int followers = 0;
                int following = 0;
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
                    UserAvatar = reader.IsDBNull(4) ? "/uploads/default-avatar.png" : reader.GetString(4),
                        // Followers and Following will be set later
                };
                    reader.Close();

                    // Get followers count
                    var followersCmd = new NpgsqlCommand(@"SELECT COUNT(*) FROM ""FollowTable"" WHERE following_id = @id", conn);
                    followersCmd.Parameters.AddWithValue("id", userId.Value);
                    followers = Convert.ToInt32(followersCmd.ExecuteScalar());

                    // Get following count
                    var followingCmd = new NpgsqlCommand(@"SELECT COUNT(*) FROM ""FollowTable"" WHERE follower_id = @id", conn);
                    followingCmd.Parameters.AddWithValue("id", userId.Value);
                    following = Convert.ToInt32(followingCmd.ExecuteScalar());
            }

            var model = new ProfileModel
            {
                UserId = user.UserId,
                FirstName = user.UserFirstname,
                LastName = user.UserLastname,
                Email = user.UserEmail,
                Bio = user.Bio,
                AvatarUrl = user.UserAvatar,
                Followers = followers,
                Following = following,
                IsFollowing = false // ไม่ต้องใช้ในหน้าโปรไฟล์ตัวเอง
            };

            return View(model);
        }

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

        [HttpGet]
        public IActionResult GetProfile()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null) return Unauthorized();

                UserDetail user;
                int followers = 0;
                int following = 0;
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
                        UserAvatar = reader.IsDBNull(7) ? "/uploads/default-avatar.png" : reader.GetString(7)
                    };
                    reader.Close();

                    // Get followers count
                    var followersCmd = new NpgsqlCommand(@"SELECT COUNT(*) FROM ""FollowTable"" WHERE following_id = @id", conn);
                    followersCmd.Parameters.AddWithValue("id", userId.Value);
                    followers = Convert.ToInt32(followersCmd.ExecuteScalar());

                    // Get following count
                    var followingCmd = new NpgsqlCommand(@"SELECT COUNT(*) FROM ""FollowTable"" WHERE follower_id = @id", conn);
                    followingCmd.Parameters.AddWithValue("id", userId.Value);
                    following = Convert.ToInt32(followingCmd.ExecuteScalar());
                }

            return Json(new
            {
                userId = user.UserId,
                username = $"{user.UserFirstname} {user.UserLastname}",
                email = user.UserEmail,
                bio = user.Bio,
                avatar = user.UserAvatar,
                followers = followers,
                following = following,
                isFollowing = false // ไม่ต้องใช้ในหน้าโปรไฟล์ตัวเอง
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
                            user_lastname = @lastname, 
                            bio = @bio,
                            user_avatar = @avatar
                        WHERE user_id = @userId";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("firstname", model.FirstName);
            cmd.Parameters.AddWithValue("lastname", model.LastName);
            cmd.Parameters.AddWithValue("bio", model.Bio ?? "");
            cmd.Parameters.AddWithValue("avatar", model.AvatarUrl ?? "/uploads/default-avatar.png");
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

        [HttpGet]
        public IActionResult GetSessionData()
        {
            var userId = HttpContext.Session.GetInt32("UserId");
            var firstName = HttpContext.Session.GetString("FirstName");
            var lastName = HttpContext.Session.GetString("LastName");
            var email = HttpContext.Session.GetString("Email");

            if (userId == null)
            {
                return Json(new { isLoggedIn = false });
            }

            return Json(new
            {
                isLoggedIn = true,
                userId = userId,
                firstName = firstName,
                lastName = lastName,
                email = email
            });
        }
    [HttpGet]
    public IActionResult GetUserProfile(int userId)
        {
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(@"
                SELECT user_id, user_firstname, user_lastname, user_avatar, user_email
                FROM ""UserDetailTable""
                WHERE user_id = @id", conn);
            cmd.Parameters.AddWithValue("id", userId);
            using var reader = cmd.ExecuteReader();
            if (!reader.Read()) return NotFound();
            var id = reader.GetInt32(0);
            var firstName = reader.GetString(1);
            var lastName = reader.GetString(2);
            var avatar = reader.IsDBNull(3) ? "/uploads/default-avatar.png" : reader.GetString(3);
            var email = reader.GetString(4);
            reader.Close();

            // Username: use email before @ if you want
            var username = email.Contains("@") ? email.Split('@')[0] : email;

            // Check follow status
            bool isFollowing = false;
            if (sessionUserId != null && sessionUserId != userId)
            {
                var followCmd = new NpgsqlCommand(@"SELECT 1 FROM ""FollowTable"" WHERE follower_id=@follower AND following_id=@following", conn);
                followCmd.Parameters.AddWithValue("follower", sessionUserId.Value);
                followCmd.Parameters.AddWithValue("following", userId);
                using var followReader = followCmd.ExecuteReader();
                isFollowing = followReader.Read();
            }

            return Json(new {
                userId = id,
                firstName,
                lastName,
                avatar,
                username,
                isFollowing,
                isSelf = (sessionUserId == userId)
            });
        }
        [HttpPost]
        public IActionResult Follow(int userId)
        {
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            if (sessionUserId == null || sessionUserId == userId)
                return BadRequest(new { success = false, message = "Invalid user." });
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            // Check if already following
            var checkCmd = new NpgsqlCommand(@"SELECT 1 FROM ""FollowTable"" WHERE follower_id=@follower AND following_id=@following", conn);
            checkCmd.Parameters.AddWithValue("follower", sessionUserId.Value);
            checkCmd.Parameters.AddWithValue("following", userId);
            using (var reader = checkCmd.ExecuteReader())
            {
                if (reader.Read())
                    return Ok(new { success = true, message = "Already following." });
            }
            var cmd = new NpgsqlCommand(@"INSERT INTO ""FollowTable"" (follower_id, following_id) VALUES (@follower, @following)", conn);
            cmd.Parameters.AddWithValue("follower", sessionUserId.Value);
            cmd.Parameters.AddWithValue("following", userId);
            cmd.ExecuteNonQuery();
            return Ok(new { success = true, message = "Followed successfully." });
        }

        [HttpPost]
        public IActionResult Unfollow(int userId)
        {
            var sessionUserId = HttpContext.Session.GetInt32("UserId");
            if (sessionUserId == null || sessionUserId == userId)
                return BadRequest(new { success = false, message = "Invalid user." });
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            var cmd = new NpgsqlCommand(@"DELETE FROM ""FollowTable"" WHERE follower_id=@follower AND following_id=@following", conn);
            cmd.Parameters.AddWithValue("follower", sessionUserId.Value);
            cmd.Parameters.AddWithValue("following", userId);
            cmd.ExecuteNonQuery();
            return Ok(new { success = true, message = "Unfollowed successfully." });
        }
        public class UpdateProfileRequest
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Bio { get; set; }
            public string AvatarUrl { get; set; }
        }
    }
}