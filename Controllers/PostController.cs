using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System;
using System.Globalization;
using MonkeyAssenbly.Models;

namespace MonkeyAssenbly.Controllers
{
    // [ApiController]  // Remove this attribute for classic MVC form POST binding
    [Route("[controller]")]
    public class PostController : Controller
    {
        private readonly string _connectionString;

        public PostController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("GetAllPost")]
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
              u.user_firstname, u.user_lastname, u.user_avatar, u.user_id
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
                        hostId = reader.GetInt32(reader.GetOrdinal("user_id")),
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

        [HttpGet("GetMyPost/{user_id}")]
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
                    u.user_firstname, u.user_lastname, u.user_avatar, u.user_id
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
                        dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("dd-MM-yyyy"),
                        dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("dd-MM-yyyy"),
                        maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                        currentParticipants = currentParticipantsArray.Length,
                        participants = currentParticipantsArray.Select(x => x.ToString()).ToList(),
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
                    });
                }
            }

            return Ok(posts);
        }

        [HttpGet("GetPostsByTag")]
        public IActionResult GetPostsByTag([FromQuery] string tag)
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
                    u.user_firstname, u.user_lastname, u.user_avatar, u.user_id,
                    t.tag_name
                FROM ""PostTable"" p
                JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
                JOIN ""PostTagTable"" pt ON p.post_id = pt.post_id
                JOIN ""TagTable"" t ON pt.tag_id = t.tag_id
                WHERE LOWER(t.tag_name) = LOWER(@tag)
                ORDER BY p.post_date_open DESC";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("tag", tag);
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
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed",
                        tag = reader.GetString(reader.GetOrdinal("tag_name")),
                        hostId = reader.GetInt32(reader.GetOrdinal("user_id"))
                    });
                }
            }

            return Ok(posts);
        }

        [HttpGet("GetJoinedPost/{user_id}")]
        public IActionResult GetJoinedPost(int user_id)
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
              u.user_firstname, u.user_lastname, u.user_avatar, u.user_id
          FROM ""PostTable"" p
          JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
          ORDER BY p.post_date_open DESC";

                using var command = new NpgsqlCommand(sql, connection);
                using var reader = command.ExecuteReader();

                while (reader.Read())
                {
                    int[] participantsArray = reader.IsDBNull(reader.GetOrdinal("post_current_paticipants"))
                        ? new int[0]
                        : reader.GetFieldValue<int[]>(reader.GetOrdinal("post_current_paticipants"));

                    if (!participantsArray.Contains(user_id)) continue;

                    posts.Add(new
                    {
                        id = reader.GetInt32(reader.GetOrdinal("post_id")),
                        eventName = reader.GetString(reader.GetOrdinal("post_titile")),
                        description = reader.GetString(reader.GetOrdinal("post_descript")),
                        location = reader.GetString(reader.GetOrdinal("post_place")),
                        host = reader.GetString(reader.GetOrdinal("user_firstname")) + " " + reader.GetString(reader.GetOrdinal("user_lastname")),
                        hostId = reader.GetInt32(reader.GetOrdinal("user_id")),
                        avatar = reader.IsDBNull(reader.GetOrdinal("user_avatar"))
                                ? "/uploads/default-avatar.png"
                                : reader.GetString(reader.GetOrdinal("user_avatar")),
                        startTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_open")).ToString(@"hh\:mm"),
                        endTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_close")).ToString(@"hh\:mm"),
                        dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("dd-MM-yyyy"),
                        dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("dd-MM-yyyy"),
                        maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                        currentParticipants = participantsArray.Length,
                        participants = participantsArray.Select(x => x.ToString()).ToList(),
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
                    });
                }
            }

            return Ok(posts);
        }

        [HttpGet("GetPostById/{id}")]
        public IActionResult GetPostById(int id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            connection.Open();

         var postSql = @"
         SELECT p.post_id, p.post_titile, p.post_descript, p.post_place,
             p.post_time_open, p.post_time_close, 
             p.post_date_open, p.post_date_close,
             p.post_max_paticipants, p.post_current_paticipants, p.post_status,
             u.user_firstname, u.user_lastname, u.user_avatar, u.user_id
         FROM ""PostTable"" p
         JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
         WHERE p.post_id = @id";

            using var postCmd = new NpgsqlCommand(postSql, connection);
            postCmd.Parameters.AddWithValue("id", id);

            using var reader = postCmd.ExecuteReader();
            if (!reader.Read()) return NotFound(new { success = false, message = "Post not found" });



            int[] participantsArray = reader.IsDBNull(reader.GetOrdinal("post_current_paticipants"))
                ? new int[0]
                : reader.GetFieldValue<int[]>(reader.GetOrdinal("post_current_paticipants"));

            // เก็บข้อมูล post หลักไว้ก่อน
            var postDataTemp = new {
                id = reader.GetInt32(reader.GetOrdinal("post_id")),
                eventName = reader.GetString(reader.GetOrdinal("post_titile")),
                description = reader.GetString(reader.GetOrdinal("post_descript")),
                location = reader.GetString(reader.GetOrdinal("post_place")),
                host = reader.GetString(reader.GetOrdinal("user_firstname")) + " " + reader.GetString(reader.GetOrdinal("user_lastname")),
                hostId = reader.GetInt32(reader.GetOrdinal("user_id")),
                avatar = reader.IsDBNull(reader.GetOrdinal("user_avatar"))
                            ? "/uploads/default-avatar.png"
                            : reader.GetString(reader.GetOrdinal("user_avatar")),
                startTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_open")).ToString(@"hh\:mm"),
                endTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_close")).ToString(@"hh\:mm"),
                dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("yyyy-MM-dd"),
                dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("yyyy-MM-dd"),
                maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                currentParticipants = participantsArray.Length,
                status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
            };
            reader.Close();

            // ดึงข้อมูลผู้เข้าร่วมทั้งหมด
            var participants = new List<object>();
            if (participantsArray.Length > 0)
            {
                var userIds = participantsArray;
                var paramNames = userIds.Select((id, idx) => $"@uid{idx}").ToArray();
                var participantsSql = $"SELECT user_id, user_firstname, user_lastname, user_avatar FROM \"UserDetailTable\" WHERE user_id IN ({string.Join(",", paramNames)})";
                using (var participantsCmd = new NpgsqlCommand(participantsSql, connection))
                {
                    for (int i = 0; i < userIds.Length; i++)
                        participantsCmd.Parameters.AddWithValue(paramNames[i], userIds[i]);
                    using (var participantsReader = participantsCmd.ExecuteReader())
                    {
                        while (participantsReader.Read())
                        {
                            participants.Add(new
                            {
                                userId = participantsReader.GetInt32(0),
                                name = participantsReader.GetString(1) + " " + participantsReader.GetString(2),
                                avatar = participantsReader.IsDBNull(3) ? "/uploads/default-avatar.png" : participantsReader.GetString(3)
                            });
                        }
                    }
                }
            }

            var postData = new
            {
                id = postDataTemp.id,
                eventName = postDataTemp.eventName,
                description = postDataTemp.description,
                location = postDataTemp.location,
                host = postDataTemp.host,
                hostId = postDataTemp.hostId,
                avatar = postDataTemp.avatar,
                startTime = postDataTemp.startTime,
                endTime = postDataTemp.endTime,
                dateOpen = postDataTemp.dateOpen,
                dateClose = postDataTemp.dateClose,
                maxParticipants = postDataTemp.maxParticipants,
                currentParticipants = postDataTemp.currentParticipants,
                participants = participants,
                status = postDataTemp.status
            };

            var tagSql = @"
            SELECT t.tag_name
            FROM ""PostTagTable"" pt
            JOIN ""TagTable"" t ON pt.tag_id = t.tag_id
            WHERE pt.post_id = @id";

            using var tagCmd = new NpgsqlCommand(tagSql, connection);
            tagCmd.Parameters.AddWithValue("id", id);

            var tags = new List<string>();
            using var tagReader = tagCmd.ExecuteReader();
            while (tagReader.Read())
            {
                tags.Add(tagReader.GetString(0));
            }

            return Ok(new
            {
                post = postData,
                tags = tags
            });
        }

        [HttpDelete("DeletePost/{post_id}")]
        public IActionResult DeletePost(int post_id)
        {
            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                var sql = @"DELETE FROM ""PostTable"" WHERE post_id = @post_id";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("post_id", post_id);

                int rowsAffected = command.ExecuteNonQuery();

                if (rowsAffected == 0)
                {
                    return NotFound(new { success = false, message = "Post not found" });
                }

                return Ok(new { success = true, message = "Post deleted successfully" });
            }
        }

        // ============ CREATE POST ============
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CreatePost(
            PostCreateModel model)
        {
            try
            {
                Console.WriteLine($"[DEBUG] postTitile: {model.postTitile}");
                Console.WriteLine($"[DEBUG] postDescript: {model.postDescript}");
                Console.WriteLine($"[DEBUG] postPlace: {model.postPlace}");
                Console.WriteLine($"[DEBUG] postDateOpen: {model.postDateOpen}");
                Console.WriteLine($"[DEBUG] postDateClose: {model.postDateClose}");
                Console.WriteLine($"[DEBUG] postTimeOpen: {model.postTimeOpen}");
                Console.WriteLine($"[DEBUG] postTimeClose: {model.postTimeClose}");
                Console.WriteLine($"[DEBUG] postMaxPaticipants: {model.postMaxPaticipants}");

                var cultureInfo = new CultureInfo("en-US");
                cultureInfo.DateTimeFormat.Calendar = new GregorianCalendar();
                CultureInfo.DefaultThreadCurrentCulture = cultureInfo;
                CultureInfo.DefaultThreadCurrentUICulture = cultureInfo;

                var userId = HttpContext.Session.GetInt32("UserId");
                if (userId == null)
                {
                    TempData["ErrorMessage"] = "กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม";
                    return RedirectToAction("Login", "Login");
                }

                if (string.IsNullOrEmpty(model.postTitile) ||
                    string.IsNullOrEmpty(model.postDateOpen) || string.IsNullOrEmpty(model.postDateClose))
                {
                    TempData["ErrorMessage"] = "กรุณากรอกข้อมูลให้ครบถ้วน (title, dates)";
                    return RedirectToAction("Home", "Home");
                }

                if (string.IsNullOrEmpty(model.postDescript))
                {
                    model.postDescript = "ไม่มีรายละเอียด";
                }

                if (!model.postMaxPaticipants.HasValue || model.postMaxPaticipants.Value <= 0)
                {
                    TempData["ErrorMessage"] = "จำนวนผู้เข้าร่วมต้องมากกว่า 0";
                    return RedirectToAction("Home", "Home");
                }

                if (!DateTime.TryParseExact(model.postDateOpen, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDateOpen))
                {
                    TempData["ErrorMessage"] = "รูปแบบวันที่เปิดไม่ถูกต้อง";
                    return RedirectToAction("Home", "Home");
                }

                if (!DateTime.TryParseExact(model.postDateClose, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDateClose))
                {
                    TempData["ErrorMessage"] = "รูปแบบวันที่ปิดไม่ถูกต้อง";
                    return RedirectToAction("Home", "Home");
                }

                TimeSpan parsedTimeOpen = TimeSpan.Zero;
                TimeSpan parsedTimeClose = TimeSpan.Zero;

                if (!string.IsNullOrEmpty(model.postTimeOpen))
                {
                    if (!TimeSpan.TryParse(model.postTimeOpen, out parsedTimeOpen))
                    {
                        TempData["ErrorMessage"] = "รูปแบบเวลาเปิดไม่ถูกต้อง";
                        return RedirectToAction("Home", "Home");
                    }
                }

                if (!string.IsNullOrEmpty(model.postTimeClose))
                {
                    if (!TimeSpan.TryParse(model.postTimeClose, out parsedTimeClose))
                    {
                        TempData["ErrorMessage"] = "รูปแบบเวลาปิดไม่ถูกต้อง";
                        return RedirectToAction("Home", "Home");
                    }
                }

                if (parsedDateClose < parsedDateOpen)
                {
                    TempData["ErrorMessage"] = "วันที่ปิดต้องมากกว่าหรือเท่ากับวันที่เปิด";
                    return RedirectToAction("Home", "Home");
                }

                using var conn = new NpgsqlConnection(_connectionString);
                conn.Open();
                using var tran = conn.BeginTransaction();

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
                postCmd.Parameters.AddWithValue("title", model.postTitile);
                postCmd.Parameters.AddWithValue("description", model.postDescript);
                postCmd.Parameters.AddWithValue("place", string.IsNullOrEmpty(model.postPlace) ? "ไม่ระบุสถานที่" : model.postPlace);
                postCmd.Parameters.AddWithValue("timeOpen", parsedTimeOpen);
                postCmd.Parameters.AddWithValue("timeClose", parsedTimeClose);
                postCmd.Parameters.AddWithValue("dateOpen", NpgsqlTypes.NpgsqlDbType.Date, parsedDateOpen);
                postCmd.Parameters.AddWithValue("dateClose", NpgsqlTypes.NpgsqlDbType.Date, parsedDateClose);
                postCmd.Parameters.AddWithValue("maxParticipants", model.postMaxPaticipants.Value);
                postCmd.Parameters.AddWithValue("currentParticipants", new int[0]);
                postCmd.Parameters.AddWithValue("status", true);
                postCmd.Parameters.AddWithValue("ownerId", userId.Value);

                var postId = postCmd.ExecuteScalar();

                // ===== Insert Tag and PostTagTable =====
                if (!string.IsNullOrWhiteSpace(model.tagName) && postId != null)
                {
                    int tagId = -1;
                    // 1. Insert tag ถ้ายังไม่มี
                    using (var tagCmd = new NpgsqlCommand("INSERT INTO \"TagTable\" (tag_name) VALUES (@tagName) ON CONFLICT (tag_name) DO NOTHING RETURNING tag_id;", conn, tran))
                    {
                        tagCmd.Parameters.AddWithValue("tagName", model.tagName.Trim());
                        var result = tagCmd.ExecuteScalar();
                        if (result != null)
                            tagId = Convert.ToInt32(result);
                    }
                    if (tagId == -1)
                    {
                        // ถ้า tag มีอยู่แล้ว ให้ select id
                        using (var selectTagCmd = new NpgsqlCommand("SELECT tag_id FROM \"TagTable\" WHERE tag_name = @tagName;", conn, tran))
                        {
                            selectTagCmd.Parameters.AddWithValue("tagName", model.tagName.Trim());
                            tagId = Convert.ToInt32(selectTagCmd.ExecuteScalar());
                        }
                    }
                    // 2. Insert post_id, tag_id ลง PostTagTable
                    using (var ptCmd = new NpgsqlCommand("INSERT INTO \"PostTagTable\" (post_id, tag_id) VALUES (@postId, @tagId) ON CONFLICT DO NOTHING;", conn, tran))
                    {
                        ptCmd.Parameters.AddWithValue("postId", Convert.ToInt32(postId));
                        ptCmd.Parameters.AddWithValue("tagId", tagId);
                        ptCmd.ExecuteNonQuery();
                    }
                }

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
        [HttpGet("GetComments")]
        public IActionResult GetComments(int postId)
        {
            var comments = new List<object>();

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

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

        [HttpPost("AddComment")]
        public async Task<IActionResult> AddComment(int postId, string commentText)
        {
            // ตรวจสอบ session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "กรุณาเข้าสู่ระบบ" });
            }

            if (string.IsNullOrWhiteSpace(commentText))
            {
                return BadRequest(new { message = "กรุณากรอกความคิดเห็น" });
            }

            // เพิ่ม comment ลงฐานข้อมูล
            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();

                var bangkokTz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                var thaiTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, bangkokTz);

                var sql = @"
                    INSERT INTO ""CommentTable"" (post_id, user_id, comment_text, created_at)
                    VALUES (@postId, @userId, @text, @createdAt)
                    RETURNING comment_id";

                using var command = new NpgsqlCommand(sql, connection);
                command.Parameters.AddWithValue("postId", postId);
                command.Parameters.AddWithValue("userId", userId.Value);
                command.Parameters.AddWithValue("text", commentText);
                command.Parameters.AddWithValue("createdAt", thaiTime);

                var commentId = command.ExecuteScalar();

                Console.WriteLine($"[SUCCESS] Comment added at {thaiTime:yyyy-MM-dd HH:mm:ss}");
                // ดึงชื่อผู้ใช้, ชื่อโพสต์, และ ownerId
                string userName = "";
                string postTitle = "";
                int ownerId = 0;
                using (var infoConn = new NpgsqlConnection(_connectionString))
                {
                    infoConn.Open();
                    using var userCmd = new NpgsqlCommand(@"SELECT user_firstname FROM ""UserDetailTable"" WHERE user_id = @uid", infoConn);
                    userCmd.Parameters.AddWithValue("uid", userId.Value);
                    userName = userCmd.ExecuteScalar()?.ToString() ?? "";

                    using var postCmd = new NpgsqlCommand(@"SELECT post_titile, post_owner_id FROM ""PostTable"" WHERE post_id = @pid", infoConn);
                    postCmd.Parameters.AddWithValue("pid", postId);
                    using var postReader = postCmd.ExecuteReader();
                    if (postReader.Read())
                    {
                        postTitle = postReader.IsDBNull(0) ? "" : postReader.GetString(0);
                        ownerId = postReader.IsDBNull(1) ? 0 : postReader.GetInt32(1);
                    }
                }

                // ส่ง ownerId เป็น userId ใน AddNotificationAsync
                await AddNotificationAsync("comment", $"คุณ {userName} คอมเมนต์ในโพสต์ '{postTitle}'", ownerId, postId);
            }

            // ดึงชื่อผู้ใช้เพื่อแสดงในข้อความแจ้งเตือน
            string userNameNotify = "";
            using (var infoConn = new NpgsqlConnection(_connectionString))
            {
                infoConn.Open();
                using var userCmd = new NpgsqlCommand(@"SELECT user_firstname FROM ""UserDetailTable"" WHERE user_id = @uid", infoConn);
                userCmd.Parameters.AddWithValue("uid", userId.Value);
                userNameNotify = userCmd.ExecuteScalar()?.ToString() ?? "";
            }
            // เพิ่มแจ้งเตือนประเภท comment
            await AddNotificationAsync("comment", $"คุณ {userNameNotify} คอมเมนต์ในโพสต์ {postId}", userId.Value, postId);

            return Ok(new { message = "เพิ่มความคิดเห็นสำเร็จ" });
        }
        // ==================== COMMENT SYSTEM END ====================

        // ==================== JOIN EVENT SYSTEM START ====================
        [HttpPost("JoinEvent")]
        public async Task<IActionResult> JoinEvent(int postId)
        {
            // ตรวจสอบ session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "กรุณาเข้าสู่ระบบ" });
            }

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();
                using var tran = connection.BeginTransaction();

                try
                {
                    // ดึงข้อมูลกิจกรรม
                    var selectSql = @"
                        SELECT post_current_paticipants, post_max_paticipants, post_status, post_owner_id
                        FROM ""PostTable""
                        WHERE post_id = @postId";

                    int[] currentParticipants;
                    int maxParticipants;
                    bool postStatus;
                    int ownerId;

                    using (var selectCmd = new NpgsqlCommand(selectSql, connection, tran))
                    {
                        selectCmd.Parameters.AddWithValue("postId", postId);
                        using var reader = selectCmd.ExecuteReader();

                        if (!reader.Read())
                        {
                            return NotFound(new { message = "ไม่พบกิจกรรมนี้" });
                        }

                        currentParticipants = reader.IsDBNull(0)
                            ? new int[0]
                            : reader.GetFieldValue<int[]>(0);
                        maxParticipants = reader.GetInt32(1);
                        postStatus = reader.GetBoolean(2);
                        ownerId = reader.GetInt32(3);
                    }

                    // ตรวจสอบเงื่อนไขต่าง ๆ
                    if (ownerId == userId.Value)
                    {
                        return BadRequest(new { message = "คุณเป็นเจ้าของกิจกรรมนี้ ไม่สามารถ join ได้" });
                    }

                    if (!postStatus)
                    {
                        return BadRequest(new { message = "กิจกรรมนี้ปิดรับสมัครแล้ว" });
                    }

                    if (currentParticipants.Contains(userId.Value))
                    {
                        return BadRequest(new { message = "คุณเข้าร่วมกิจกรรมนี้แล้ว" });
                    }

                    if (currentParticipants.Length >= maxParticipants)
                    {
                        return BadRequest(new { message = "กิจกรรมเต็มแล้ว" });
                    }

                    // เพิ่ม user เข้า array ผู้เข้าร่วม
                    var newParticipants = currentParticipants.Append(userId.Value).ToArray();

                    var updateSql = @"
                        UPDATE ""PostTable""
                        SET post_current_paticipants = @participants
                        WHERE post_id = @postId";

                    using (var updateCmd = new NpgsqlCommand(updateSql, connection, tran))
                    {
                        updateCmd.Parameters.AddWithValue("participants", newParticipants);
                        updateCmd.Parameters.AddWithValue("postId", postId);
                        updateCmd.ExecuteNonQuery();
                    }

                    tran.Commit();

                    // ====== แจ้งเตือนหลัง commit สำเร็จ ======
                    string userName = "";
                    string postTitle = "";
                    int ownerIdNotify = 0;
                    using (var infoConn = new NpgsqlConnection(_connectionString))
                    {
                        infoConn.Open();
                        // ดึงชื่อผู้ใช้
                        using var userCmd = new NpgsqlCommand(@"SELECT user_firstname FROM ""UserDetailTable"" WHERE user_id = @uid", infoConn);
                        userCmd.Parameters.AddWithValue("uid", userId.Value);
                        userName = userCmd.ExecuteScalar()?.ToString() ?? "";
                        // ดึงชื่อโพสต์
                        using var postCmd = new NpgsqlCommand(@"SELECT post_titile, post_owner_id FROM ""PostTable"" WHERE post_id = @pid", infoConn);
                        postCmd.Parameters.AddWithValue("pid", postId);
                        using var postReader = postCmd.ExecuteReader();
                        if (postReader.Read())
                        {
                            postTitle = postReader.IsDBNull(0) ? "" : postReader.GetString(0);
                            ownerIdNotify = postReader.IsDBNull(1) ? 0 : postReader.GetInt32(1);
                        }
                    }
                    // เพิ่มแจ้งเตือน join
                    await AddNotificationAsync("join", $"คุณ {userName} เข้าร่วมโพสต์ '{postTitle}'", ownerIdNotify, postId);

                    // ถ้าหลัง join แล้วเต็ม ให้แจ้งเตือนห้องเต็ม
                    if (newParticipants.Length >= maxParticipants)
                    {
                        await AddNotificationAsync("full", $"โพสต์ '{postTitle}' มีผู้เข้าร่วมครบแล้ว", ownerIdNotify, postId);
                    }

                    return Ok(new { message = "เข้าร่วมกิจกรรมสำเร็จ" });
                }
                catch (Exception ex)
                {
                    tran.Rollback();
                    Console.WriteLine($"[ERROR] JoinEvent: {ex.Message}");
                    return StatusCode(500, new { message = "เกิดข้อผิดพลาด" });
                }
            }
        }

        [HttpPost("UnjoinEvent")]
        public async Task<IActionResult> UnjoinEvent(int postId)
        {
            // ตรวจสอบ session
            var userId = HttpContext.Session.GetInt32("UserId");
            if (userId == null)
            {
                return Unauthorized(new { message = "กรุณาเข้าสู่ระบบ" });
            }

            using (var connection = new NpgsqlConnection(_connectionString))
            {
                connection.Open();
                using var tran = connection.BeginTransaction();

                try
                {
                    // ดึง array ผู้เข้าร่วม
                    var selectSql = @"
                        SELECT post_current_paticipants
                        FROM ""PostTable""
                        WHERE post_id = @postId";

                    int[] currentParticipants;

                    using (var selectCmd = new NpgsqlCommand(selectSql, connection, tran))
                    {
                        selectCmd.Parameters.AddWithValue("postId", postId);
                        using var reader = selectCmd.ExecuteReader();

                        if (!reader.Read())
                        {
                            return NotFound(new { message = "ไม่พบกิจกรรมนี้" });
                        }

                        currentParticipants = reader.IsDBNull(0) 
                            ? new int[0] 
                            : reader.GetFieldValue<int[]>(0);
                    }

                    // ตรวจสอบว่าผู้ใช้เข้าร่วมหรือยัง
                    if (!currentParticipants.Contains(userId.Value))
                    {
                        return BadRequest(new { message = "คุณไม่ได้เข้าร่วมกิจกรรมนี้" });
                    }

                    // ลบ user ออกจาก array ผู้เข้าร่วม
                    var newParticipants = currentParticipants.Where(id => id != userId.Value).ToArray();

                    var updateSql = @"
                        UPDATE ""PostTable""
                        SET post_current_paticipants = @participants
                        WHERE post_id = @postId";

                    using (var updateCmd = new NpgsqlCommand(updateSql, connection, tran))
                    {
                        updateCmd.Parameters.AddWithValue("participants", newParticipants);
                        updateCmd.Parameters.AddWithValue("postId", postId);
                        updateCmd.ExecuteNonQuery();
                    }

                    tran.Commit();

                    // ====== แจ้งเตือนหลัง commit สำเร็จ ======
                    string userName = "";
                    string postTitle = "";
                    int ownerIdNotify = 0;
                    using (var infoConn = new NpgsqlConnection(_connectionString))
                    {
                        infoConn.Open();
                        // ดึงชื่อผู้ใช้
                        using var userCmd = new NpgsqlCommand(@"SELECT user_firstname FROM ""UserDetailTable"" WHERE user_id = @uid", infoConn);
                        userCmd.Parameters.AddWithValue("uid", userId.Value);
                        userName = userCmd.ExecuteScalar()?.ToString() ?? "";
                        // ดึงชื่อโพสต์
                        using var postCmd = new NpgsqlCommand(@"SELECT post_titile, post_owner_id FROM ""PostTable"" WHERE post_id = @pid", infoConn);
                        postCmd.Parameters.AddWithValue("pid", postId);
                        using var postReader = postCmd.ExecuteReader();
                        if (postReader.Read())
                        {
                            postTitle = postReader.IsDBNull(0) ? "" : postReader.GetString(0);
                            ownerIdNotify = postReader.IsDBNull(1) ? 0 : postReader.GetInt32(1);
                        }
                    }
                    // เพิ่มแจ้งเตือน unjoin
                    await AddNotificationAsync("unjoin", $"คุณ {userName} ยกเลิกเข้าร่วมโพสต์ '{postTitle}'", ownerIdNotify, postId);

                    return Ok(new { message = "ออกจากกิจกรรมสำเร็จ" });
                }
                catch (Exception ex)
                {
                    tran.Rollback();
                    Console.WriteLine($"[ERROR] UnjoinEvent: {ex.Message}");
                    return StatusCode(500, new { message = "เกิดข้อผิดพลาด" });
                }
            }
        }
        [HttpGet("GetFollowedPosts/{user_id}")]
        public IActionResult GetFollowedPosts(int user_id)
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
                  u.user_firstname, u.user_lastname, u.user_avatar, u.user_id AS hostId
              FROM ""PostTable"" p
              JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
              JOIN ""FollowTable"" f ON f.following_id = p.post_owner_id
              WHERE f.follower_id = @user_id
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
                        status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed",
                        hostId = reader.GetInt32(reader.GetOrdinal("hostId"))
                    });
                }
            }
            return Ok(posts);
        }
        // ==================== JOIN EVENT SYSTEM END ====================

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