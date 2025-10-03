using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Reflection.Metadata.Ecma335;
using System.Globalization;
using MonkeyAssenbly.Models;
using static MonkeyAssenbly.Models.PostModel;

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
                   u.user_firstname, u.user_lastname, u.user_avatar
            FROM ""PostTable"" p
            JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id";

            using var command = new NpgsqlCommand(sql, connection);
            using var reader = command.ExecuteReader();

            while (reader.Read())
            {
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
                    currentParticipants = reader.GetInt32(reader.GetOrdinal("post_current_paticipants")),
                    participants = new List<string>(),
                    status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
                });
            }
        }

        return Ok(posts);
    }

    [HttpPost("CreatePost")]
    [ValidateAntiForgeryToken]
    public IActionResult CreatePost(
        string postTitile,
        string postDescript,
        string postPlace,
        string postDateOpen,
        string postDateClose,
        string postTimeOpen,
        string postTimeClose,
        int postMaxPaticipants)
    {
        try
        {
            Console.WriteLine($"[DEBUG] postTitile: {postTitile}");
            Console.WriteLine($"[DEBUG] postDateOpen: {postDateOpen}");
            Console.WriteLine($"[DEBUG] postDateClose: {postDateClose}");
            Console.WriteLine($"[DEBUG] postTimeOpen: {postTimeOpen}");
            Console.WriteLine($"[DEBUG] postTimeClose: {postTimeClose}");
            Console.WriteLine($"[DEBUG] postMaxPaticipants: {postMaxPaticipants}");

            // 1. ตรวจสอบ Session
            var userId = HttpContext.Session.GetInt32("UserId");
            Console.WriteLine($"[DEBUG] UserId from Session: {userId}");
            
            if (userId == null)
            {
                TempData["ErrorMessage"] = "กรุณาเข้าสู่ระบบก่อนสร้างกิจกรรม";
                return RedirectToAction("Login", "Login");
            }

            // 2. ตรวจสอบข้อมูล
            if (string.IsNullOrWhiteSpace(postTitile) || 
                string.IsNullOrWhiteSpace(postDateOpen) || 
                string.IsNullOrWhiteSpace(postDateClose))
            {
                TempData["ErrorMessage"] = "กรุณากรอกข้อมูลให้ครบถ้วน";
                return RedirectToAction("Home", "Home");
            }

            if (postMaxPaticipants <= 0)
            {
                TempData["ErrorMessage"] = "จำนวนผู้เข้าร่วมต้องมากกว่า 0";
                return RedirectToAction("Home", "Home");
            }

            // 3. Parse Date
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

            if (parsedDateClose <= parsedDateOpen)
            {
                TempData["ErrorMessage"] = "วันที่ปิดต้องมากกว่าวันที่เปิด";
                return RedirectToAction("Home", "Home");
            }

            Console.WriteLine($"[DEBUG] Parsed DateOpen: {parsedDateOpen}");
            Console.WriteLine($"[DEBUG] Parsed DateClose: {parsedDateClose}");

            // 4. เชื่อมต่อ Database
            using var conn = new NpgsqlConnection(_connectionString);
            conn.Open();
            Console.WriteLine("[DEBUG] Database connection opened");

            using var tran = conn.BeginTransaction();

            // 5. SQL INSERT Statement
            var sql = @"
                INSERT INTO ""PostTable"" 
                (post_titile, post_descript, post_owner_id, post_status, post_place, 
                 post_time_open, post_time_close, post_date_open, post_date_close, 
                 post_max_paticipants, post_current_paticipants)
                VALUES 
                (@title, @description, @ownerId, @status, @place, 
                 @timeOpen, @timeClose, @dateOpen, @dateClose, 
                 @maxParticipants, @currentParticipants)
                RETURNING post_id";

            using var command = new NpgsqlCommand(sql, conn, tran);
            
            // 6. เพิ่ม Parameters
            command.Parameters.AddWithValue("title", postTitile);
            command.Parameters.AddWithValue("description", 
                string.IsNullOrWhiteSpace(postDescript) ? "" : postDescript);
            command.Parameters.AddWithValue("ownerId", userId.Value);
            command.Parameters.AddWithValue("status", true);
            command.Parameters.AddWithValue("place", 
                string.IsNullOrWhiteSpace(postPlace) ? "" : postPlace);
            
            // จัดการ Time
            if (!string.IsNullOrWhiteSpace(postTimeOpen) && TimeSpan.TryParse(postTimeOpen, out TimeSpan parsedTimeOpen))
            {
                command.Parameters.AddWithValue("timeOpen", NpgsqlTypes.NpgsqlDbType.Time, parsedTimeOpen);
            }
            else
            {
                command.Parameters.AddWithValue("timeOpen", DBNull.Value);
            }
            
            if (!string.IsNullOrWhiteSpace(postTimeClose) && TimeSpan.TryParse(postTimeClose, out TimeSpan parsedTimeClose))
            {
                command.Parameters.AddWithValue("timeClose", NpgsqlTypes.NpgsqlDbType.Time, parsedTimeClose);
            }
            else
            {
                command.Parameters.AddWithValue("timeClose", DBNull.Value);
            }
            
            // ใช้ NpgsqlDbType.Date เหมือน Signup
            command.Parameters.AddWithValue("dateOpen", NpgsqlTypes.NpgsqlDbType.Date, parsedDateOpen);
            command.Parameters.AddWithValue("dateClose", NpgsqlTypes.NpgsqlDbType.Date, parsedDateClose);
            command.Parameters.AddWithValue("maxParticipants", postMaxPaticipants);
            command.Parameters.AddWithValue("currentParticipants", 0);

            Console.WriteLine("[DEBUG] Executing SQL INSERT...");

            // 7. Execute
            var newPostId = command.ExecuteScalar();
            
            tran.Commit();
            
            Console.WriteLine($"[DEBUG] Post created successfully with ID: {newPostId}");
            TempData["SuccessMessage"] = $"สร้างกิจกรรมสำเร็จ! (Post ID: {newPostId})";

            return RedirectToAction("Home", "Home");
        }
        catch (PostgresException pgEx)
        {
            Console.WriteLine($"[ERROR] PostgreSQL Error: {pgEx.Message}");
            Console.WriteLine($"[ERROR] Detail: {pgEx.Detail}");
            Console.WriteLine($"[ERROR] SqlState: {pgEx.SqlState}");
            TempData["ErrorMessage"] = $"Database Error: {pgEx.Message}";
            return RedirectToAction("Home", "Home");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] {ex.Message}");
            Console.WriteLine($"[ERROR] StackTrace: {ex.StackTrace}");
            TempData["ErrorMessage"] = $"เกิดข้อผิดพลาด: {ex.Message}";
            return RedirectToAction("Home", "Home");
        }
    }
}