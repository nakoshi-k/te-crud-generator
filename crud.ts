import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as glob from "glob";
import * as ejs from "ejs";
const ds = path.sep;

class model_to_rsv{
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

    get data(){
        return {
            name : this._name,
            names : this._name,
            fields : this.viewFields()
        }
    }

    public className = (field) =>{
        return field.type.constructor.name;
    }

    private DBTypesInputTypes = {
        "STRING" : "text",
        "TEXT" : "textarea",
        "INTEGER" : "number",
        "BIGINT" : "number",
    }

    public attrType (field){
        let className = this.className(field);
        let type = "text";
        let dbtit = this.DBTypesInputTypes;
        if(dbtit[className]){
            type = dbtit[className];
        }        
        return type;
    }

    public cssClass = (field) => {
        let cssClass = "";
        if(this.className(field) === "DATE"){
            cssClass += " " + "calender";
        }
        return "";
    }
    
    public typesTags = {
        "STRING" : "input",
        "TEXT" : "textarea"
    }
    
    public tag = ( field ) => {
        let tag = "input";
        let className = this.className(field);
        let tt = this.typesTags;
        if(tt[className]){
           tag = tt[className];
        }
        return tag ;
    }
    
    public attr = (field) => {
        let htmlAttr = {};
        let options = field.options
        if(options){
            if(typeof options.length !== "undefined"){
                htmlAttr["length"] = options.lenght;
            }
        }
        htmlAttr["css"] = this.cssClass(field);
        
        if(this.tag(field) !== "textarea" ){
            htmlAttr["type"] = this.attrType(field);
        }
        
        let htmlAttrString = ""
        for( let key in htmlAttr ){
            if( htmlAttr[key] === ""){
                continue;
            }
            htmlAttrString += ` ${key}="${htmlAttr[key]}"`
        }
        return htmlAttrString;
    }    

    public viewFields = () => {
        let fields = this._fields;
        let viewFields = {};
        for(let key in fields){
            if(String(key) === "created_at" ||
               String(key) === "updated_at"){
                continue;
            }
            let f = {
                name : key,
                tag : this.tag(fields[key]),
                attr : this.attr(fields[key])
            }
            viewFields[key] = f;
        }
        return viewFields;
    }

    public read(file){
        let read = new Promise((resolve , reject) => {
            resolve("aaaa");
        })
        return read;
    }
    public preCreate(){
        
    }
    public create = ( str ,file ) => {
        let create = new Promise((resolve) => {
            let source = ejs.render(str, this.viewFields());
            let outFilename = file.replace(/\.ejs$/,"");
            mkdirp.sync(this._config.outDirectory + ds + this._name)
            let out = this._config.outDirectory + ds + this._name + ds + outFilename;
            console.log(out);
            console.log(source);
            fs.writeFile(out, source , function (err) {
                console.log(err);
                if (err) {
                    console.log(133);
                    throw err;
                }
                console.log(`create file ${out}` );
            });
        })
    }
    
    async readCreate( file ){
        let template = await this.read(file);
        return this.create(template,file);
    }

}

interface config{
    modelDirectory : string;
    templateDirectory : string;
    outDirectory : string;
}

let mtr = new model_to_rsv();
let config = {
    templateDirectory : `../apps/templates`,
    modelDirectory: `../models`,
    outDirectory : __dirname + "/../" + "apps"
}
mtr.config = config;
let models = require(config.modelDirectory);
mtr.template = "default";
mtr.fields = models.tasks.attributes
mtr.name = "tasks";

mtr.readCreate("router.ts.ejs").then( () => {
}).catch((err) => {
    console.log(err);
});