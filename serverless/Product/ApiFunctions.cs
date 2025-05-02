using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Host;
using System;

namespace OpenHack.Serverless
{
    public static class ApiFunctions
    {
        public static IProductService ProductService = new ProductService();

        [FunctionName("GetProducts")]
        public static IActionResult GetProducts([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, TraceWriter log)
        {
            log.Info("C# HTTP trigger function GetProducts processed a request.");

            return new JsonResult(ProductService.ListProducts());
        }

        [FunctionName("GetProduct")]
        public static IActionResult GetProduct([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = null)]HttpRequest req, TraceWriter log)
        {
            log.Info("C# HTTP trigger function GetProduct processed a request.");

            string productid = req.Query["productId"];
            Guid guidproductid;

            if(productid != null && Guid.TryParse(productid, out guidproductid))
            {
                Product product = ProductService.GetProduct(guidproductid);
                return product != null
                ? (ActionResult)new JsonResult(product)
                : new BadRequestObjectResult("Product does not exist");
            }
            else
            {
                return new BadRequestObjectResult("Please pass a valid productId on the query string");
            } 
        }
    }
}
