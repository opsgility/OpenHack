
using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Host;

namespace OpenHack.Serverless
{
    public static class ApiFunctions
    {
        public static IUserService UserService = new UserService();

        [FunctionName("GetUser")]
        public static IActionResult GetUser([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, TraceWriter log)
        {
            log.Info("C# HTTP trigger GetUser function processed a request.");

            string userid = req.Query["userId"];
            Guid guiduserid;

            if(userid != null && Guid.TryParse(userid, out guiduserid))
            {
                User user = UserService.GetUser(guiduserid);
                return user != null
                ? (ActionResult)new JsonResult(user)
                : new BadRequestObjectResult("User does not exist");
            }
            else
            {
                return new BadRequestObjectResult("Please pass a valid userId on the query string");
            } 
        }
    }
}
