const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../configs")("app");

class AuthMiddleware {
  static checkAuth = async (action, req, res, next) => {
    const unrestricted = config.UNRESTRICTED_ROUTES.find((route) =>
      req.originalUrl.match(route)
    );
    if (unrestricted) {
        const result = await action(req, res)
        res.json(result);
    } else {
      const token = req.cookies.auth;
      if (token) {
        const result = jwt.verify(token, config.JWT_SECRET);
        if (result && result.email) {
          const UserService = require("../services/user.service");
          const userService = new UserService();
          const rows = await userService.select({
            where: `email=${result.email}`,
          });
          if (rows.length === 1) {
            const user = rows.pop();
            const token = req.cookies.log;
            const result = jwt.verify(token, config.JWT_SECRET);
            if (result.code && bcrypt.compare(result.code,  `${config.HASH_PREFIX + user.pin_code}`)) {
              //authenticated
              res.locals.id = user.id;
              res.json(await action(req, res));
            } else {
              //ask pin code
              res.json({ state: 1 });
            }
          } else {
            //create account
            res.json({ state: 0 });
          }
        } else {
          //ask email
          res.json({ state: -1 });
        }
      } else {
        //ask email
        res.json({ state: -1 });
      }
    }
  };
}
module.exports = AuthMiddleware.checkAuth;
