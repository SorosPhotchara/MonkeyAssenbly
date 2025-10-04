using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Reflection.Metadata.Ecma335;
using System.Globalization;
using MonkeyAssenbly.Models;

[ApiController]
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
                    currentParticipants = currentParticipantsArray.Length, // นับจำนวนปัจจุบัน
                    participants = currentParticipantsArray.Select(x => x.ToString()).ToList(), // แปลงเป็น List<string> ถ้าต้องส่ง JSON
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
                   u.user_firstname, u.user_lastname, u.user_avatar
            FROM ""PostTable"" p
            JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
            WHERE p.post_owner_id = @user_id";

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
                    dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("dd-MM-yyy"),
                    dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("dd-MM-yyy"),
                    maxParticipants = reader.GetInt32(reader.GetOrdinal("post_max_paticipants")),
                    currentParticipants = currentParticipantsArray.Length, // นับจำนวนปัจจุบัน
                    participants = currentParticipantsArray.Select(x => x.ToString()).ToList(), // แปลงเป็น List<string> ถ้าต้องส่ง JSON
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
                    u.user_firstname, u.user_lastname, u.user_avatar,
                    t.tag_name
                FROM ""PostTable"" p
                JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
                JOIN ""PostTagTable"" pt ON p.post_id = pt.post_id
                JOIN ""TagTable"" t ON pt.tag_id = t.tag_id
                WHERE LOWER(t.tag_name) = LOWER(@tag)";

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
                    tag = reader.GetString(reader.GetOrdinal("tag_name"))
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
                   u.user_firstname, u.user_lastname, u.user_avatar
            FROM ""PostTable"" p
            JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id";

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
                    avatar = reader.IsDBNull(reader.GetOrdinal("user_avatar"))
                            ? "/uploads/default-avatar.png"
                            : reader.GetString(reader.GetOrdinal("user_avatar")),
                    startTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_open")).ToString(@"hh\:mm"),
                    endTime = reader.GetTimeSpan(reader.GetOrdinal("post_time_close")).ToString(@"hh\:mm"),
                    dateOpen = reader.GetDateTime(reader.GetOrdinal("post_date_open")).ToString("dd-MM-yyy"),
                    dateClose = reader.GetDateTime(reader.GetOrdinal("post_date_close")).ToString("dd-MM-yyy"),
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

        // STEP 1: ดึงโพสต์
        var postSql = @"
        SELECT p.post_id, p.post_titile, p.post_descript, p.post_place,
               p.post_time_open, p.post_time_close, 
               p.post_date_open, p.post_date_close,
               p.post_max_paticipants, p.post_current_paticipants, p.post_status,
               u.user_firstname, u.user_lastname, u.user_avatar
        FROM ""PostTable"" p
        JOIN ""UserDetailTable"" u ON p.post_owner_id = u.user_id
        WHERE p.post_id = @id
    ";

        using var postCmd = new NpgsqlCommand(postSql, connection);
        postCmd.Parameters.AddWithValue("id", id);

        using var reader = postCmd.ExecuteReader();
        if (!reader.Read()) return NotFound(new { success = false, message = "Post not found" });

        int[] participantsArray = reader.IsDBNull(reader.GetOrdinal("post_current_paticipants"))
            ? new int[0]
            : reader.GetFieldValue<int[]>(reader.GetOrdinal("post_current_paticipants"));

        var postData = new
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
            currentParticipants = participantsArray.Length,
            participants = participantsArray.Select(p => p.ToString()).ToList(),
            status = reader.GetBoolean(reader.GetOrdinal("post_status")) ? "open" : "closed"
        };
        reader.Close();

        // STEP 2: ดึง tag ที่เชื่อมกับโพสต์นี้
        var tagSql = @"
        SELECT t.tag_name
        FROM ""PostTagTable"" pt
        JOIN ""TagTable"" t ON pt.tag_id = t.tag_id
        WHERE pt.post_id = @id
    ";

        using var tagCmd = new NpgsqlCommand(tagSql, connection);
        tagCmd.Parameters.AddWithValue("id", id);

        var tags = new List<string>();
        using var tagReader = tagCmd.ExecuteReader();
        while (tagReader.Read())
        {
            tags.Add(tagReader.GetString(0));
        }

        // STEP 3: รวมข้อมูลแล้วส่งกลับ
        return Ok(new
        {
            post = postData,
            tags = tags
        });
    }

    //[HttpGet("GetCommentByPostId/{post_id}")]
    //public IActionResult GetCommentByPostId(int post_id)
    //{
    //    var comments = new List<object>();

    //    using var connection = new NpgsqlConnection(_connectionString);
    //    connection.Open();

    //    var sql = @"
    //    SELECT comment_id, user_id, comment_text, created_at
    //    FROM ""CommentTable""
    //    WHERE post_id = @post_id
    //    ORDER BY created_at ASC
    //";

    //    using var cmd = new NpgsqlCommand(sql, connection);
    //    cmd.Parameters.AddWithValue("post_id", post_id);

    //    using var reader = cmd.ExecuteReader();
    //    while (reader.Read())
    //    {
    //        comments.Add(new
    //        {
    //            id = reader.GetInt32(reader.GetOrdinal("comment_id")),
    //            userId = reader.GetInt32(reader.GetOrdinal("user_id")),
    //            text = reader.GetString(reader.GetOrdinal("comment_text")),
    //            createdAt = reader.GetDateTime(reader.GetOrdinal("created_at")).ToString("yyyy-MM-dd HH:mm:ss")
    //        });
    //    }

    //    return Ok(comments);
    //}

    [HttpPut("UpdatePost/{post_id}")]
    public IActionResult UpdatePost(int post_id, [FromBody] PostUpdateDto dto)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        connection.Open();

        var sql = @"
        UPDATE ""PostTable""
        SET post_titile = @title,
            post_descript = @description,
            post_place = @location,
            post_date_open = @dateOpen,
            post_date_close = @dateClose,
            post_time_open = @startTime,
            post_time_close = @endTime,
            post_max_paticipants = @maxParticipants,
            post_status = @status
        WHERE post_id = @id
    ";

        using var cmd = new NpgsqlCommand(sql, connection);
        cmd.Parameters.AddWithValue("id", post_id);
        cmd.Parameters.AddWithValue("title", dto.eventName);
        cmd.Parameters.AddWithValue("description", dto.description);
        cmd.Parameters.AddWithValue("location", dto.location);
        cmd.Parameters.AddWithValue("dateOpen", DateTime.Parse(dto.dateOpen));
        cmd.Parameters.AddWithValue("dateClose", DateTime.Parse(dto.dateClose));
        cmd.Parameters.AddWithValue("startTime", TimeSpan.Parse(dto.startTime));
        cmd.Parameters.AddWithValue("endTime", TimeSpan.Parse(dto.endTime));
        cmd.Parameters.AddWithValue("maxParticipants", dto.maxParticipants);
        cmd.Parameters.AddWithValue("status", dto.status);

        int affected = cmd.ExecuteNonQuery();
        return Ok(new { success = affected > 0 });
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




    //[HttpPost]
    //[ValidateAntiForgeryToken]
    //public IActionResult CreatePost(
    //        string eventName,
    //        string description,
    //        string location,
    //        string lastNhostame,
    //        string gender,
    //        string birthdate,
    //        string email,
    //        string avatarUrl,
    //        string bio)
    //{
    //    var res = "got it man";
    //    return Ok(res);
    //}

}
