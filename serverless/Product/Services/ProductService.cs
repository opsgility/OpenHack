using System;
using System.Collections.Generic;
using System.Linq;

namespace OpenHack.Serverless
{
    public interface IProductService
    {
        IList<Product> ListProducts();
        Product GetProduct(Guid productId);
    }

    public class ProductService : IProductService
    {
        protected internal static IList<Product> products = new List<Product> { 
                new Product {productId = Guid.Parse("75542e38-563f-436f-adeb-f426f1dabb5c"), productName = "Starfruit Explosion", productDescription = "This starfruit ice cream is out of this world!"},
                new Product {productId = Guid.Parse("e94d85bc-7bd0-44f3-854e-d8cd70348b63"), productName = "Just Peachy", productDescription = "Your taste buds and this ice cream were made for peach other."},
                new Product {productId = Guid.Parse("288fd748-ad2b-4417-83b9-7aa5be9cff22"), productName = "Tropical Mango", productDescription = "You know what they say... It takes two.  You.  And this ice cream."},
                new Product {productId = Guid.Parse("76065ecd-8a14-426d-a4cd-abbde2acbb10"), productName = "Gone Bananas", productDescription = "I'm not sure how appealing banana ice cream really is."},
                new Product {productId = Guid.Parse("551a9be9-7f1c-447d-83ee-b18f5a6fb018"), productName = "Matcha Green Tea", productDescription = "Green tea ice cream is good for you because it is green."},
                new Product {productId = Guid.Parse("80bab959-ef8b-4ae3-8bf2-e876d77277b6"), productName = "French Vanilla", productDescription = "It's vanilla ice cream."},
                new Product {productId = Guid.Parse("4c25613a-a3c2-4ef3-8e02-9c335eb23204"), productName = "Truly Orange-inal", productDescription = "Made from concentrate."},
                new Product {productId = Guid.Parse("65ab124a-9b2c-4294-a52d-18839364ef15"), productName = "Durian Durian", productDescription = "Smells suspect but tastes... also suspect."},
                new Product {productId = Guid.Parse("e4e7068e-500e-4a00-8be4-630d4594735b"), productName = "It's Grape!", productDescription = "Unraisinably good ice cream."},
                new Product {productId = Guid.Parse("0f5a0fe8-4506-4332-969e-699a693334a8"), productName = "Beer", productDescription = "Hey this isn't ice cream!"}
        };
        public IList<Product> ListProducts()
        {
            return products;
        }

        public Product GetProduct(Guid productId)
        {
            Product product = (from p in products
                    where p.productId == productId 
                    select p).FirstOrDefault();
            return product;
        }
    }
}