using Microsoft.AspNetCore.Http;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MonkeyAssenbly.Models;
using Npgsql;
namespace MonkeyAssenbly.Controllers
{
    public class TagsController : BaseController
    {
        private readonly string _connectionString;
        public TagsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }
        // GET: TagsController
        public IActionResult Tags()
        {
            return View();
        }
        
        // // GET: TagsController/Details/5
        // public ActionResult Details(int id)
        // {
        //     return View();
        // }

        // // GET: TagsController/Create
        // public ActionResult Create()
        // {
        //     return View();
        // }
        [HttpGet]
        [Route("tags")]
        public async Task<IActionResult> GetTags()
        {
            var tags = new List<Tag>();
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            var sql = "SELECT tag_id, tag_name FROM \"TagTable\" ORDER BY tag_name ASC";
            await using var cmd = new NpgsqlCommand(sql, conn);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                tags.Add(new Tag { TagId = reader.GetInt32(0), TagName = reader.GetString(1) });
            }
            return Ok(tags.Select(t => new { id = t.TagId, name = t.TagName }));
        }
        // POST: TagsController/Create
        // [HttpPost]
        // [ValidateAntiForgeryToken]
        // public ActionResult Create(IFormCollection collection)
        // {
        //     try
        //     {
        //         return RedirectToAction(nameof(Index));
        //     }
        //     catch
        //     {
        //         return View();
        //     }
        // }

        // // GET: TagsController/Edit/5
        // public ActionResult Edit(int id)
        // {
        //     return View();
        // }

        // // POST: TagsController/Edit/5
        // [HttpPost]
        // [ValidateAntiForgeryToken]
        // public ActionResult Edit(int id, IFormCollection collection)
        // {
        //     try
        //     {
        //         return RedirectToAction(nameof(Index));
        //     }
        //     catch
        //     {
        //         return View();
        //     }
        // }

        // // GET: TagsController/Delete/5
        // public ActionResult Delete(int id)
        // {
        //     return View();
        // }

        // // POST: TagsController/Delete/5
        // [HttpPost]
        // [ValidateAntiForgeryToken]
        // public ActionResult Delete(int id, IFormCollection collection)
        // {
        //     try
        //     {
        //         return RedirectToAction(nameof(Index));
        //     }
        //     catch
        //     {
        //         return View();
        //     }
        // }
    }
}
