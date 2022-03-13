const BaseController = require("./base.controller");
const UserService = require("../services/user.service");
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
    const userService = new UserService();
    const rows = await userService.select({
      where: `email='${req.body.email}'`,
    });
    if (rows.length === 1) {
      const user = rows.pop();
      const { email, id } = user;
      const token = jwt.sign({ email, id }, config.JWT_SECRET);
      return { token };
    } else {
      return { email: req.body.email };
    }
  }

  create = async (req) => {
    const userService = new UserService();
    const hashed = (await bcrypt.hash(req.body.pin_code, 4)).replace(config.HASH_PREFIX,'');
    const result = await userService.insert({email:req.body.email, pin_code:hashed});
    //TODO send email

    if(result){
      const { email, id } = result;
      const token = jwt.sign({ email, id }, config.JWT_SECRET);
      return { token };
    }
    return false;

  }

  login = async (req) => {
    const token = req.cookies.auth;
    if (token) {
      let decoded;
      try{
          decoded = jwt.verify(token, config.JWT_SECRET);
      }
      catch{}
      if(decoded){
        const userService = new UserService();
        const rows = await userService.select({
          where: `id='${decoded.id}'`,
        });
        if (rows.length === 1) {
          const user = rows.pop();
          const result = await bcrypt.compare(req.body.pin_code, `${config.HASH_PREFIX + user.pin_code}`);
          return result;
        }
      }
    }
    return false;
  }

  renew = async (req) => {
    //generate random 4 digit pin_code
    const rndPin = Math.floor(1000 + Math.random() * 9000);
    //update db

    //and send it by email
    
    //return result to react
  }

  

}
module.exports = AuthController;
