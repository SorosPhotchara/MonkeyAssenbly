using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using MonkeyAssenbly.Models;
using System.Threading.Tasks;

namespace MonkeyAssenbly.Controllers
{
    public class LoginController : Controller
    {
        private readonly string _connectionString;

        public LoginController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginModel model)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var sql = @"SELECT a.account_id, u.user_id, u.user_firstname, u.user_lastname, u.user_email
                        FROM ""AccountTable"" a
                        JOIN ""UserDetailTable"" u ON a.account_id = u.account_id
                        WHERE a.username = @username AND a.passwd = @password;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("username", model.Username);
            cmd.Parameters.AddWithValue("password", model.Password);

            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                // บันทึก Session
                HttpContext.Session.SetInt32("UserId", reader.GetInt32(1));
                HttpContext.Session.SetString("FirstName", reader.GetString(2));
                HttpContext.Session.SetString("LastName", reader.GetString(3));
                HttpContext.Session.SetString("Email", reader.GetString(4));

                return RedirectToAction("Profile", "Profile");
            }

            ViewBag.Error = "Invalid username or password";
            return View();
        }

        [HttpGet, HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }


    }
}