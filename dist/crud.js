"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const mkdirp = require("mkdirp");
const path = require("path");
const ejs = require("ejs");
const ds = path.sep;
class model_to_rsv {
    constructor() {
        this._fields = {};
        this._name = "";
        this._template = "";
        this.className = (field) => {
            return field.type.constructor.name;
        };
        this.DBTypesInputTypes = {
            "STRING": "text",
            "TEXT": "textarea",
            "INTEGER": "number",
            "BIGINT": "number",
        };
        this.cssClass = (field) => {
            let cssClass = "";
            if (this.className(field) === "DATE") {
                cssClass += " " + "calender";
            }
            return "";
        };
        this.typesTags = {
            "STRING": "input",
            "TEXT": "textarea"
        };
        this.tag = (field) => {
            let tag = "input";
            let className = this.className(field);
            let tt = this.typesTags;
            if (tt[className]) {
                tag = tt[className];
            }
            return tag;
        };
        this.attr = (field) => {
            let htmlAttr = {};
            let options = field.options;
            if (options) {
                if (typeof options.length !== "undefined") {
                    htmlAttr["length"] = options.lenght;
                }
            }
            htmlAttr["css"] = this.cssClass(field);
            if (this.tag(field) !== "textarea") {
                htmlAttr["type"] = this.attrType(field);
            }
            let htmlAttrString = "";
            for (let key in htmlAttr) {
                if (htmlAttr[key] === "") {
                    continue;
                }
                htmlAttrString += ` ${key}="${htmlAttr[key]}"`;
            }
            return htmlAttrString;
        };
        this.viewFields = () => {
            let fields = this._fields;
            let viewFields = {};
            for (let key in fields) {
                if (String(key) === "created_at" ||
                    String(key) === "updated_at") {
                    continue;
                }
                let f = {
                    name: key,
                    tag: this.tag(fields[key]),
                    attr: this.attr(fields[key])
                };
                viewFields[key] = f;
            }
            return viewFields;
        };
        this.create = (str, file) => {
            let create = new Promise((resolve) => {
                let source = ejs.render(str, this.viewFields());
                let outFilename = file.replace(/\.ejs$/, "");
                mkdirp.sync(this._config.outDirectory + ds + this._name);
                let out = this._config.outDirectory + ds + this._name + ds + outFilename;
                console.log(out);
                console.log(source);
                fs.writeFile(out, source, function (err) {
                    console.log(err);
                    if (err) {
                        console.log(133);
                        throw err;
                    }
                    console.log(`create file ${out}`);
                });
            });
        };
    }
    set fields(fields) {
        this._fields = fields;
    }
    set name(name) {
        this._name = name;
    }
    set template(template) {
        this._template = template;
    }
    set config(config) {
        this._config = config;
    }
    get data() {
        return {
            name: this._name,
            names: this._name,
            fields: this.viewFields()
        };
    }
    attrType(field) {
        let className = this.className(field);
        let type = "text";
        let dbtit = this.DBTypesInputTypes;
        if (dbtit[className]) {
            type = dbtit[className];
        }
        return type;
    }
    read(file) {
        let read = new Promise((resolve, reject) => {
            resolve("aaaa");
        });
        return read;
    }
    preCreate() {
    }
    readCreate(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let template = yield this.read(file);
            return this.create(template, file);
        });
    }
}
let mtr = new model_to_rsv();
let config = {
    templateDirectory: `../apps/templates`,
    modelDirectory: `../models`,
    outDirectory: __dirname + "/../" + "apps"
};
mtr.config = config;
let models = require(config.modelDirectory);
mtr.template = "default";
mtr.fields = models.tasks.attributes;
mtr.name = "tasks";
mtr.readCreate("router.ts.ejs").then(() => {
}).catch((err) => {
    console.log(err);
});
