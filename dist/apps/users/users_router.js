"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("../router");
const users_service_1 = require("./users_service");
const helpers = require("../../base/helper");
class users_router extends router_1.router {
    constructor() {
        super();
        this.name = "users";
        this.beforeRender = (req, res) => {
            this.helper("form", new helpers.form());
            this.helper("pagination", new helpers.pagination());
            this.csrfReady(req);
        };
        this.search = (req, res, next) => {
            let pagination = this.service.pagination();
            let conditions = this.service.conditions(req);
            let entities = pagination.find(conditions, req.query);
            let data = {};
            entities.then((result) => {
                // for rows
                data[this.entities_name] = result.rows;
                data["page"] = result.pagination;
                this.setData(data);
                this.render(req, res, "index");
            }).catch((error) => {
                data[this.entities_name] = {};
                this.setData(data);
                this.render(req, res, "index");
            });
        };
        this.add = (req, res, next) => {
            console.log(req.body);
            //スキーマを取得してセットする。
            let data = {};
            data[this.entity_name] = {};
            if (req.body) {
                data[this.entity_name] = req.body;
            }
            this.setData(data);
            this.render(req, res, "add");
        };
        this.view = (req, res, next) => {
            let model = this.model;
            model.findById(req.params.id).then((result) => {
                if (!result) {
                    res.redirect(`/${this.entities_name}`);
                }
                let data = {};
                data[this.entity_name] = result.dataValues;
                this.setData(data);
                this.render(req, res, "view");
            });
        };
        this.edit = (req, res, next) => {
            let model = this.model;
            model.findById(req.params.id).then((result) => {
                if (!result) {
                    res.redirect(`/${this.entities_name}`);
                }
                let data = {};
                data[this.entity_name] = result.dataValues;
                this.setData(data);
                this.render(req, res, "edit");
            });
        };
        this.delete = (req, res) => {
            let model = this.model;
            model.findById(req.params.id).then((result) => {
                if (result) {
                    result.destroy().then(() => {
                        res.sendStatus(204);
                    });
                    return;
                }
                res.sendStatus(500);
            });
        };
        this.insert = (req, res, next) => {
            let entity = this.model.build(req.body);
            entity.save().then((res) => {
                if (this.isXhr(req)) {
                    res.status(201);
                    res.json(entity.dataValues);
                    return;
                }
                res.redirect(`/${this.entities_name}`);
            }).catch((err) => {
                req.body.errors = this.service.validationError(err);
                if (this.isXhr(req)) {
                    res.status(400);
                    res.json(req.body.errors);
                    return;
                }
                this.add(req, res, next);
            });
        };
        this.update = (req, res, next) => {
            let model = this.model;
            model.findById(req.params.id).then((entity) => {
                entity.update(req.body).then((result) => {
                    if (this.isXhr(req)) {
                        res.status(201);
                        res.json(result);
                        return;
                    }
                    res.redirect(`/${this.entities_name}`);
                }).catch((err) => {
                    if (this.isXhr(req)) {
                        res.status(400);
                        res.json(err);
                        return;
                    }
                    this.edit(req, res, next);
                });
            }).catch((err) => {
                if (this.isXhr(req)) {
                    res.status(400);
                    res.json(err);
                    return;
                }
            });
        };
        this.bind = (router) => {
            let csrfProtection = this.csrfProtection;
            router.get("/", csrfProtection, this.search);
            router.get("/page/:page", csrfProtection, this.search);
            router.get("/add", csrfProtection, this.add);
            router.get("/:id", csrfProtection, this.view);
            router.post("/", csrfProtection, this.insert);
            router.get("/:id/edit", csrfProtection, this.edit);
            router.put("/:id", csrfProtection, this.update);
            router.delete("/:id", csrfProtection, this.delete);
            return router;
        };
        this.service = new users_service_1.users_service(this.name);
    }
}
exports.users_router = users_router;
