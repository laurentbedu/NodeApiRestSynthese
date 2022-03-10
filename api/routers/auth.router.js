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

        this.router.post("/register", async (req, res, next) => {
            next(this.controller.register);
        });
    }

}

module.exports = AuthRouter;
