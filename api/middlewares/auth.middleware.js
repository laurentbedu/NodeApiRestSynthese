
class AuthMiddleware {
  static checkAuth = async (action, req, res, next) => {
    res.json(await action(req, res));
  };
}
module.exports = AuthMiddleware.checkAuth;
