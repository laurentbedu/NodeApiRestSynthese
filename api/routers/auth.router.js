const BaseRouter = require("./base.router");

class AuthRouter extends BaseRouter {

    constructor(){
        super();
        this.initalizeRoutes();
    }

    initalizeRoutes = () => {

        this.router.get("/", async (req, res, next) => {
            next(this.controller.check);
        });

        this.router.post("/", async (req, res, next) => {
            next(this.controller.auth);
        });

        this.router.post("/create", async (req, res, next) => {
            next(this.controller.create);
        });

        this.router.post("/login", async (req, res, next) => {
            next(this.controller.login);
        });

        this.router.get("/renew", async (req, res, next) => {
            next(this.controller.renew);
        });
    }

}

module.exports = AuthRouter;
