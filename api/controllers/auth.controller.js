const BaseController = require("./base.controller");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../configs")("app");

class AuthController extends BaseController {

  check = async (req) => {
    const token = req.cookies.auth;
    if (token) {
        let result;
        try{
            result = jwt.verify(token, config.JWT_SECRET);
        }
        catch{}
        return result && result.email;
    }
    return false;
  }

  auth = async (req) => {
    const UserService = require("../services/user.service");
    const userService = new UserService();
    const rows = await userService.select({
      where: `email='${req.body.email}'`,
    });
    if (rows.length === 1) {
      const user = rows.pop();
      const { email } = user;
      const token = jwt.sign({ email }, config.JWT_SECRET);
      return { token };
    } else {
      return { email: req.body.email };
    }
  }
}
module.exports = AuthController;
