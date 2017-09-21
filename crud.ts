import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as glob from "glob";
import * as ejs from "ejs";
import * as inflection from "inflection";
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
    get name(){
        return inflection.singularize(this._name);
    }
    get names(){
        return inflection.pluralize(this._name);
    }
    get data(){
        return {
            name : this.name,
            names : this.names,
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
            let templatePath = this._config.templateDirectory + ds + this._template + ds;
            console.log(templatePath);
            fs.readFile( templatePath + ds + file , "utf-8" , (err,data) => {
                if(err){
                    reject(err);
                }
                resolve(data);
            })
        })
        return read;
    }
    public preCreate(){
        
    }
    public create = ( str ,file ) => {
        let create = new Promise((resolve) => {
            console.log(this.data);
            let source = ejs.render(str, this.data );
            let outFilename = file.replace(/\.ejs$/,"");
            let outDir = this._config.outDirectory  + ds + this._name;
            try{
                mkdirp.sync(outDir);
            }catch(e){
                throw e;
            }
            let out = outDir + ds + outFilename;
            fs.writeFile(out, source , function (err) {
                console.log(err);
                if (err) {
                    console.log(err);
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
    templateDirectory : __dirname + "/../apps/templates",
    modelDirectory: __dirname + `/../models`,
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