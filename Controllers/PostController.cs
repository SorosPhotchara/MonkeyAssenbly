using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System;
using System.Globalization;
using MonkeyAssenbly.Models;

namespace MonkeyAssenbly.Controllers
{
    public class PostController : Controller
    {
        private readonly string _connectionString;

        public PostController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult GetAllPost()
        {
            var posts = new List<object>();

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                var sql = @"
                SELECT p.post_id, p.post_titile, p.post_descript, p.post_place, 
                       p.post_time_open, p.post_time_close, 
                       p.post_date_open, p.post_date_close,
                       p.post_max_paticipants, p.post_current_paticipants, p.post_status,
                       u.user_firstname, u.user_lastname, u.user_avatar
                FROM ""PostTable"" p
                JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
                ORDER BY p.post_date_open DESC";

                using var command = new NpgsqlCommand(sql, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    int[] currentParticipantsArray = reader.IsDBNull(reader.GetOrdinal("post_current_paticipants"))
                        ? new int[0]
                        : reader.GetFieldValue<int[]>(reader.GetOrdinal("post_current_paticipants"));

                    posts.Add(new
                    {
                        id = reader.GetInt32(reader.GetOrdinal("post_id")),
                        eventName = reader.GetString(reader.GetOrdinal("post_titile")),
                        description = reader.GetString(reader.GetOrdinal("post_descript")),
                        location = reader.GetString(reader.GetOrdinal("post_place")),
                        host = reader.GetString(reader.GetOrdinal("user_firstname")) + " " + reader.GetString(reader.GetOrdinal("user_lastname")),
                        avatar = reader.IsDBNull(reader.GetOrdinal("user_avatar"))
                                ? "/uploads/default-avatar.png"
                                : reader.GetString(reader.GetOrdinal("user_avatar")),
                        startTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_open")).ToString(@"hh\:mm"),
                        endTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_close")).ToString(@"hh\:mm"),
                        dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("yyyy-MM-dd"),
                        dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("yyyy-MM-dd"),
                        maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                        currentParticipants = currentParticipantsArray.Length,
                        participants = currentParticipantsArray.Select(x => x.ToString()).ToList(),
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
                    });
                }
            }

            return Ok(posts);
        }


        [HttpGet]
        public IActionResult GetMyPost(int user_id)
        {
            var posts = new List<object>();

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                var sql = @"
                SELECT p.post_id, p.post_titile, p.post_descript, p.post_place, 
                       p.post_time_open, p.post_time_close, 
                       p.post_date_open, p.post_date_close,
                       p.post_max_paticipants, p.post_current_paticipants, p.post_status,
                       u.user_firstname, u.user_lastname, u.user_avatar
                FROM ""PostTable"" p
                JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
                WHERE p.post_owner_id = @user_id
                ORDER BY p.post_date_open DESC";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("user_id", user_id);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    int[] currentParticipantsArray = reader.IsDBNull(reader.GetOrdinal("post_current_paticipants"))
                        ? new int[0]
                        : reader.GetFieldValue<int[]>(reader.GetOrdinal("post_current_paticipants"));

                    posts.Add(new
                    {
                        id = reader.GetInt32(reader.GetOrdinal("post_id")),
                        eventName = reader.GetString(reader.GetOrdinal("post_titile")),
                        description = reader.GetString(reader.GetOrdinal("post_descript")),
                        location = reader.GetString(reader.GetOrdinal("post_place")),
                        host = reader.GetString(reader.GetOrdinal("user_firstname")) + " " + reader.GetString(reader.GetOrdinal("user_lastname")),
                        avatar = reader.IsDBNull(reader.GetOrdinal("user_avatar"))
                                 ? "/uploads/default-avatar.png"
                                 : reader.GetString(reader.GetOrdinal("user_avatar")),
                        startTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_open")).ToString(@"hh\:mm"),
                        endTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_close")).ToString(@"hh\:mm"),
                        dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("yyyy-MM-dd"),
                        dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("yyyy-MM-dd"),
                        maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                        currentParticipants = currentParticipantsArray.Length,
                        participants = currentParticipantsArray.Select(x => x.ToString()).ToList(),
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
                    });
                }
            }

            return Ok(posts);
        }


        // ============ CREATE POST ============
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CreatePost(
            string? postTitile,
            string? postDescript,
            string? postPlace,
            string? postDateOpen,
            string? postDateClose,
            string? postTimeOpen,
            string? postTimeClose,
            int? postMaxPaticipants)
        {
            try
            {
                // ---------- Debug: แสดงค่าที่ได้รับ ----------
                Console.WriteLine($"[DEBUG] postTitile: {postTitile}");
                Console.WriteLine($"[DEBUG] postDescript: {postDescript}");
                Console.WriteLine($"[DEBUG] postPlace: {postPlace}");
                Console.WriteLine($"[DEBUG] postDateOpen: {postDateOpen}");
                Console.WriteLine($"[DEBUG] postDateClose: {postDateClose}");
                Console.WriteLine($"[DEBUG] postTimeOpen: {postTimeOpen}");
                Console.WriteLine($"[DEBUG] postTimeClose: {postTimeClose}");
                Console.WriteLine($"[DEBUG] postMaxPaticipants: {postMaxPaticipants}");

                // ---------- Force Gregorian Calendar ----------
                var cultureInfo = new CultureInfo("en-US");
                cultureInfo.DateTimeFormat.Calendar = new GregorianCalendar();
                CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
                CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

                // ---------- ตรวจสอบว่า User Login หรือยัง ----------
                var userId = HttpContext.Session.GetInt32("UserId");
                if (userId == null)
                {
                    TempData["ErrorMessage"] = "กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม";
                    return RedirectToAction("Login", "Login");
                }

                // ---------- ตรวจสอบข้อมูล ----------
                if (string.IsNullOrEmpty(postTitile) ||
                    string.IsNullOrEmpty(postDateOpen) || string.IsNullOrEmpty(postDateClose))
                {
                    TempData["ErrorMessage"] = "กรุณากรอกข้อมูลให้ครบถ้วน (title, dates)";
                    return RedirectToAction("Home", "Home");
                }

                // ถ้า description ว่าง ให้ใส่ค่า default
                if (string.IsNullOrEmpty(postDescript))
                {
                    postDescript = "ไม่มีรายละเอียด";
                }

                if (!postMaxPaticipants.HasValue || postMaxPaticipants.Value <= 0)
                {
                    TempData["ErrorMessage"] = "จำนวนผู้เข้าร่วมต้องมากกว่า 0";
                    return RedirectToAction("Home", "Home");
                }

                // ---------- Parse Date ----------
                if (!DateTime.TryParseExact(postDateOpen, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDateOpen))
                {
                    TempData["ErrorMessage"] = "รูปแบบวันที่เปิดไม่ถูกต้อง";
                    return RedirectToAction("Home", "Home");
                }

                if (!DateTime.TryParseExact(postDateClose, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDateClose))
                {
                    TempData["ErrorMessage"] = "รูปแบบวันที่ปิดไม่ถูกต้อง";
                    return RedirectToAction("Home", "Home");
                }

                // ---------- Parse Time (Optional) ----------
                TimeSpan parsedTimeOpen = TimeSpan.Zero;
                TimeSpan parsedTimeClose = TimeSpan.Zero;

                if (!string.IsNullOrEmpty(postTimeOpen))
                {
                    if (!TimeSpan.TryParse(postTimeOpen, out parsedTimeOpen))
                    {
                        TempData["ErrorMessage"] = "รูปแบบเวลาเปิดไม่ถูกต้อง";
                        return RedirectToAction("Home", "Home");
                    }
                }

                if (!string.IsNullOrEmpty(postTimeClose))
                {
                    if (!TimeSpan.TryParse(postTimeClose, out parsedTimeClose))
                    {
                        TempData["ErrorMessage"] = "รูปแบบเวลาปิดไม่ถูกต้อง";
                        return RedirectToAction("Home", "Home");
                    }
                }

                // ---------- ตรวจสอบวันที่ ----------
                if (parsedDateClose < parsedDateOpen)
                {
                    TempData["ErrorMessage"] = "วันที่ปิดต้องมากกว่าหรือเท่ากับวันที่เปิด";
                    return RedirectToAction("Home", "Home");
                }

                using var conn = new NpgsqlConnection(_connectionString);
                conn.Open();
                using var tran = conn.BeginTransaction();

                // ---------- Insert to PostTable ----------
                var insertPostSql = @"
                    INSERT INTO ""PostTable"" 
                    (post_titile, post_descript, post_place, post_time_open, post_time_close,
                     post_date_open, post_date_close, post_max_paticipants, post_current_paticipants,
                     post_status, post_owner_id)
                    VALUES (@title, @description, @place, @timeOpen, @timeClose,
                            @dateOpen, @dateClose, @maxParticipants, @currentParticipants,
                            @status, @ownerId)
                    RETURNING post_id;";

                using var postCmd = new NpgsqlCommand(insertPostSql, conn, tran);
                postCmd.Parameters.AddWithValue("title", postTitile);
                postCmd.Parameters.AddWithValue("description", postDescript);
                postCmd.Parameters.AddWithValue("place", string.IsNullOrEmpty(postPlace) ? "ไม่ระบุสถานที่" : postPlace);
                postCmd.Parameters.AddWithValue("timeOpen", parsedTimeOpen);
                postCmd.Parameters.AddWithValue("timeClose", parsedTimeClose);
                postCmd.Parameters.AddWithValue("dateOpen", NpgsqlTypes.NpgsqlDbType.Date, parsedDateOpen);
                postCmd.Parameters.AddWithValue("dateClose", NpgsqlTypes.NpgsqlDbType.Date, parsedDateClose);
                postCmd.Parameters.AddWithValue("maxParticipants", postMaxPaticipants.Value);
                postCmd.Parameters.AddWithValue("currentParticipants", new int[0]);
                postCmd.Parameters.AddWithValue("status", true);
                postCmd.Parameters.AddWithValue("ownerId", userId.Value);

                var postId = postCmd.ExecuteScalar();
                tran.Commit();

                Console.WriteLine($"[SUCCESS] Post created with ID: {postId}");
                TempData["SuccessMessage"] = "สร้างกิจกรรมสำเร็จ!";
                return RedirectToAction("Home", "Home");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] CreatePost: {ex.Message}");
                TempData["ErrorMessage"] = "เกิดข้อผิดพลาด: " + ex.Message;
                return RedirectToAction("Home", "Home");
            }
        }
        // ==================== COMMENT SYSTEM START ====================

        // ดึง comments ทั้งหมดของ post
        [HttpGet]
        public IActionResult GetComments(int postId)
        {
            var comments = new List<object>();

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                // Join กับ UserDetailTable เพื่อดึงชื่อผู้แสดงความคิดเห็น
                var sql = @"
                    SELECT c.comment_id, c.comment_text, c.created_at,
                        u.user_firstname, u.user_lastname, u.user_avatar
                    FROM ""CommentTable"" c
                    JOIN ""UserDetailTable"" u ON c.user_id = u.user_id
                    WHERE c.post_id = @postId
                    ORDER BY c.created_at ASC";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("postId", postId);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    comments.Add(new
                    {
                        commentId = reader.GetInt32(0),
                        text = reader.GetString(1),
                        createdAt = reader.GetDateTime(2).ToString("dd/MM/yyyy HH:mm"),
                        userName = reader.GetString(3) + " " + reader.GetString(4),
                        userAvatar = reader.IsDBNull(5) ? "/uploads/default-avatar.png" : reader.GetString(5)
                    });
                }
            }

            return Ok(comments);
        }

        // เพิ่ม comment ใหม่
        [HttpPost]
        public IActionResult AddComment(int postId, string commentText)
        {
            // ตรวจสอบว่า login หรือยัง
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "กรุณาเข้าสู่ระบบ" });
            }

            // ตรวจสอบว่ากรอกข้อความหรือยัง
            if (string.IsNullOrWhiteSpace(commentText))
            {
                return BadRequest(new { message = "กรุณากรอกความคิดเห็น" });
            }

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                // Insert comment ใหม่
                var sql = @"
                    INSERT INTO ""CommentTable"" (post_id, user_id, comment_text)
                    VALUES (@postId, @userId, @text)
                    RETURNING comment_id";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("postId", postId);
                command.Parameters.AddWithValue("userId", userId.Value);
                command.Parameters.AddWithValue("text", commentText);

                var commentId = command.ExecuteScalar();

                Console.WriteLine($"[SUCCESS] Comment added: ID={commentId}, PostID={postId}, UserID={userId}");
            }

            return Ok(new { message = "เพิ่มความคิดเห็นสำเร็จ" });
        }

        // ==================== COMMENT SYSTEM END ====================
    }
}