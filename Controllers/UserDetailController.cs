using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Collections.Generic;
using System.Threading.Tasks;
using MonkeyAssenbly.Models;
using Microsoft.Extensions.Configuration;

namespace MonkeyAssenbly.Controllers
{
    public class UserDetailController : Controller
    {
        private readonly string _connectionString;

        public UserDetailController(IConfiguration configuration)
        {
            // Read the connection string from appsettings.json
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IActionResult> Index()
        {
            var users = new List<UserDetail>();

            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync(); // will use SSL automatically per connection string

            var sql = @"SELECT user_id, user_firstname, user_lastname, user_gender, user_birthdate, user_email, account_id
                        FROM ""UserDetailTable"" ORDER BY user_id;";

            await using var cmd = new NpgsqlCommand(sql, conn);
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                users.Add(new UserDetail
                {
                    UserId = reader.GetInt32(0),
                    UserFirstname = reader.GetString(1),
                    UserLastname = reader.GetString(2),
                    UserGender = reader.GetString(3),
                    UserBirthdate = reader.GetDateTime(4),
                    UserEmail = reader.GetString(5),
                    AccountId = reader.IsDBNull(6) ? null : reader.GetInt32(6)
                });
            }

            return View(users);
        }
    }
}
