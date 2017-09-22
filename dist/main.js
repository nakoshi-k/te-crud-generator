"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const inquirer = require("inquirer");
const crud_1 = require("./crud");
const ds = path.sep;
class cli {
    constructor() {
        this.listModels = () => {
            let models = new Promise((resolve, reject) => {
                glob(this.config.modelDirectory + ds + "*.js", {}, function (er, files) {
                    if (er) {
                        reject();
                    }
                    let models = [];
                    files.forEach(element => {
                        let s = element.split(ds).pop();
                        s = s.split(".");
                        s.pop();
                        s = s.join(".");
                        if (s !== "index") {
                            models.push(s);
                        }
                    });
                    resolve(models);
                });
            });
            return models;
        };
        this.listTemplates = () => {
            let templates = new Promise((resolve, reject) => {
                glob(this.config.templateDirectory + ds + "*/", {}, function (er, files) {
                    if (er) {
                        reject();
                    }
                    let templates = [];
                    files.forEach(element => {
                        let t = element.split(ds);
                        let s = t.pop();
                        while (s === "") {
                            s = t.pop();
                        }
                        ;
                        templates.push(s);
                    });
                    resolve(templates);
                });
            });
            return templates;
        };
        this.q_overwrite = () => {
            return inquirer.prompt({
                type: "confirm",
                name: "overwrite",
                message: "overwrite?"
            });
        };
        this.q_selecttemplate = (templates) => {
            return inquirer.prompt({
                type: "list",
                name: "template",
                message: "select template",
                choices: templates
            });
        };
        let shellCurrent = process.cwd();
        let configFileName = "ten.generator.config.json";
        let configFilePath = `${shellCurrent}${ds}${configFileName}`;
        this._config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        this.models = require(shellCurrent + ds + this.config.modelDirectory);
    }
    set config(config) {
        this._config = config;
    }
    get config() {
        return this._config;
    }
    q_model(models) {
        return inquirer.prompt({
            type: "list",
            name: "model",
            message: "select create model",
            choices: models
        });
    }
    async plot() {
        let models = await this.listModels();
        let selectModel = await this.q_model(models);
        let templates = await this.listTemplates();
        let selectTemplate = await this.q_selecttemplate(templates);
        let overwrite = await this.q_overwrite();
        let crud = new crud_1.model_to_rsv();
        crud.name = selectModel.model;
        crud.fields = this.models[selectModel.model].rawAttributes;
        crud.template = selectTemplate.template;
        crud.config = this.config;
        crud.overwrite = overwrite.overwrite;
        return crud;
    }
    start() {
        return this.plot().then(crud => {
            crud.build();
        });
    }
}
exports.cli = cli;
