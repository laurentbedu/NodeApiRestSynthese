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

  register = async (req) => {
    const { email, code } = req.body;
    const pin_code = (await bcrypt.hash(code, 4)).replace(
      config.HASH_PREFIX,
      ""
    );

    const UserService = require("../services/user.service");
    const userService = new UserService();
    const result = await userService.insert({ email, pin_code });
    if (result) {
      const auth = jwt.sign({ email }, config.JWT_SECRET);
      const log = jwt.sign({ code }, config.JWT_SECRET);
      return { state: 2, tokens: { auth, log } };
    }
    return { state: -1 };
  };
}
module.exports = AuthController;
