module.exports = (context, req) => {
    let swagger = require("./swagger.json");
    context.res.json(swagger);
};