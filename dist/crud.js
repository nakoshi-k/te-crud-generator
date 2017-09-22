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
const glob = require("glob");
const ejs = require("ejs");
const inflection = require("inflection");
const ds = path.sep;
class model_to_rsv {
    constructor() {
        this._fields = {};
        this._name = "";
        this._template = "";
        this.className = (field) => {
            return field.type.constructor.key;
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
                cssClass += " calendar";
            }
            return cssClass;
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
            htmlAttr["class"] = this.cssClass(field);
            if (this.tag(field) !== "textarea") {
                htmlAttr["type"] = this.attrType(field);
            }
            let htmlAttrString = [];
            for (let key in htmlAttr) {
                if (htmlAttr[key] === "") {
                    continue;
                }
                htmlAttrString.push(`"${key}" : "${htmlAttr[key].trim()}"`);
            }
            return `{ ${htmlAttrString.join(",")} }`;
        };
        /* for form data*/
        this.viewFields = () => {
            let fields = this._fields;
            let viewFields = [];
            for (let key in fields) {
                let f = {
                    name: key,
                    tag: this.tag(fields[key]),
                    attr: this.attr(fields[key])
                };
                viewFields.push(f);
            }
            return viewFields;
        };
        this._overwrite = true;
        this.fileAccess = (file) => {
            let fileAccess = new Promise((resolve, reject) => {
                fs.access(file, function (err) {
                    if (err) {
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
            return fileAccess;
        };
        this.create = (str, file) => {
            let create = new Promise((resolve) => {
                let data = this.data;
                data["action"] = file.split(ds).pop().split(".").shift();
                let source = ejs.render(str, data);
                let outFilename = file.replace(/\.ts\.ejs$/, ".ts");
                let outDir = path.resolve(this._config.outDirectory) + ds + this._name;
                let subDir = file.split(ds);
                subDir.pop();
                subDir.join(ds);
                try {
                    mkdirp.sync(outDir + ds + subDir);
                }
                catch (e) {
                    throw e;
                }
                let out = outDir + ds + outFilename;
                this.fileAccess(out).then(res => {
                    if (res === true && this._overwrite === false) {
                        console.log(`skip file ${out}`);
                        return;
                    }
                    fs.writeFile(out, source, function (err) {
                        if (err) {
                            console.log(err);
                            throw err;
                        }
                        console.log(`create file ${out}`);
                    });
                });
            });
        };
        this.templates = () => {
            let templates = new Promise((resolve, reject) => {
                let td = this._config.templateDirectory + ds + this._template;
                td = path.resolve(td) + ds;
                let d = `${td}**${ds}*.ejs`;
                glob(d, {}, function (er, files) {
                    if (er) {
                        reject();
                    }
                    for (let key in files) {
                        files[key] = files[key].replace(td, "");
                    }
                    resolve(files);
                });
            });
            return templates;
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
    get name() {
        return inflection.singularize(this._name);
    }
    get names() {
        return inflection.pluralize(this._name);
    }
    get data() {
        return {
            name: this.name,
            names: this.names,
            fields: this.viewFields(),
            template: this._template
        };
    }
    attrType(field) {
        let className = this.className(field);
        let type = "text";
        let dbtit = this.DBTypesInputTypes;
        if (dbtit[className]) {
            type = dbtit[className];
        }
        if (field.primaryKey) {
            type = "hidden";
        }
        ;
        return type;
    }
    read(file) {
        let read = new Promise((resolve, reject) => {
            let td = path.resolve(this._config.templateDirectory);
            let templatePath = td + ds + this._template + ds;
            fs.readFile(templatePath + ds + file, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
        return read;
    }
    preCreate() {
    }
    set overwrite(status) {
        this._overwrite = status;
    }
    readCreate(file) {
        return __awaiter(this, void 0, void 0, function* () {
            let str = yield this.read(file);
            return this.create(str, file);
        });
    }
    build() {
        return __awaiter(this, void 0, void 0, function* () {
            let templates = yield this.templates();
            for (let key in templates) {
                this.readCreate(templates[key]);
            }
            return true;
        });
    }
}
exports.model_to_rsv = model_to_rsv;
