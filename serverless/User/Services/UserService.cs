using System;
using System.Collections.Generic;
using System.Linq;

namespace OpenHack.Serverless
{
    public interface IUserService
    {
        IList<User> ListUsers();
        User GetUser(Guid userid);
    }

    public class UserService : IUserService
    {
        protected internal static IList<User> users = new List<User> { 
            new User(){userId = Guid.Parse("cc5581ff-6be1-4418-a8d8-55a29c24b995"), userName = "garry.thornburg", fullName = "Garry Thornburg"},
            new User(){userId = Guid.Parse("6dd3bb49-a5be-41ca-9dac-3b995450f2db"), userName = "kayla.cobb", fullName = "Kayla Cobb"},
            new User(){userId = Guid.Parse("ed414804-ed3d-4ec3-a283-f94ee86f3e23"), userName = "edna.waters", fullName = "Edna Waters"},
            new User(){userId = Guid.Parse("d1f80b77-040f-4ec8-a833-90b18da70337"), userName = "chester.furlong", fullName = "Chester Furlong"},
            new User(){userId = Guid.Parse("cc20a6fb-a91f-4192-874d-132493685376"), userName = "doreen.riddle", fullName = "Doreen Riddle"}
        };
        public IList<User> ListUsers()
        {
            return users;
        }
        public User GetUser(Guid userId)
        {
            User user = (from p in users
                    where p.userId == userId 
                    select p).FirstOrDefault();
            return user;
        }
    }
}