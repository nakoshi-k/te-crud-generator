"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("../service");
class users_service extends service_1.service {
    constructor(name) {
        super(name);
        this.conditions = (req) => {
            let search = this.search();
            search.query = req.query;
            search.page = req.params.page;
            search.limit = 10;
            search.append("name", search.like("%{word}%"));
            return search.build();
        };
    }
}
exports.users_service = users_service;
