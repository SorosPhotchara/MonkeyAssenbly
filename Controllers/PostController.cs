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


    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult CreatePost(
            string eventName,
            string description,
            string location,
            string lastNhostame,
            string gender,
            string birthdate,
            string email,
            string avatarUrl,
            string bio)
    {
        var res = "got it man";
        return Ok(res);
    }

}
