import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import * as inquirer from "inquirer";
const ds = path.sep;

class create_crud{
    private _fields = {};
    private _name = "";
    private _template = "";
    private _config :config;
    set fields (fields){
        this._fields = fields;
    }
    set name (name :string){
        this._name = name;
    }
    set template(template :string){
        this._template = template;
    }
    set config(config:config){
        this._config = config;
    }



    public create = () => {
        let create = new Promise( (resolve,reject) => {
            
            resolve();
        } )
    }

}

interface config{
    modelDirectory : string;
    templateDirectory : string;
}

class cli {
    
    public models;

    private _config : config;

    set config (config : config) {
        this._config = config;
    }
    
    get config (){
        return this._config;
    }
    
    private listModels = () => {
        let models = new Promise((resolve,reject) => {
            glob( this.config.modelDirectory + ds + "*.js", {} , function (er, files) {
                if(er){
                    reject();
                }
               let models = [];
               files.forEach(element => {
                    let s = element.split(ds).pop();
                    s = s.split(".");
                    s.pop();
                    s = s.join(".");
                    if(s !== "index"){
                        models.push(s);
                    }
                });
                resolve(models);
            })
        })
        return models;
    }

    private listTemplates  = () => {
        let templates = new Promise((resolve,reject) => {
            glob( this.config.templateDirectory + ds + "*/", {} , function (er, files) {
                if(er){
                    reject();
                }
                let templates = [];
               files.forEach(element => {
                   let t = element.split(ds);
                   let s = t.pop();
                   while( s === "" ){
                       s = t.pop();
                   };
                   templates.push(s);                    
                });
                resolve(templates);
            })
        })
        return templates;
    }

    constructor(){
        let shellCurrent =  process.cwd();
        let configFileName = "ten.generator.config.json";
        let configFilePath = `${shellCurrent}${ds}${configFileName}`;
        this._config = JSON.parse(fs.readFileSync( configFilePath , 'utf8'));
        this.models  = require( shellCurrent + ds + this.config.modelDirectory);
    }

    private q_model (models) {
        return inquirer.prompt({
            type : "list",
            name : "model",
            message : "select create model",
            choices : models            
        })
    }

    private q_overwrite =  () => {
        return inquirer.prompt({
            type : "confirm",
            name : "overwrite",
            message : "overwrite?"
        })
    }
    
    private q_selecttemplate = (templates) => {
        return inquirer.prompt({
            type : "list",
            name : "template",
            message : "select template",
            choices : templates
        })
    }


    async plot (){
        let models  = await this.listModels();
        let selectModel = await this.q_model(models);
        let templates = await this.listTemplates();
        let selectTemplate = await this.q_selecttemplate(templates);
        let orverwrite = await this.q_overwrite();
        let crud = new create_crud();
        crud.name = selectModel.model;
        crud.fields = app.models[ selectModel.model ].rawAttributes;
        crud.template = selectTemplate.template;
        crud.config = this.config;
        await crud.create();

    }

    public start(){
        return this.plot();
    }  

}



let app = new cli();

app.start()
