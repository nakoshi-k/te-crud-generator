import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as path from "path";
import * as glob from "glob";
import * as ejs from "ejs";
import * as inflection from "inflection";
const ds = path.sep;

export class model_to_rsv{
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
            fields : this.viewFields(),
            template : this._template
        }
    }

    public className = (field) =>{
        return field.type.constructor.key;
    }

    private DBTypesInputTypes = {
        "STRING" : "text",
        "TEXT" : "textarea",
        "INTEGER" : "number",
        "BIGINT" : "number",
        "DATE" : "date",
    }

    public attrType (field){
        let className = this.className(field);
        let type = "text";
        let dbtit = this.DBTypesInputTypes;
        if(dbtit[className]){
            type = dbtit[className];
        }        
        if(field.primaryKey){
            type = "hidden"
        };
        return type;
    }

    public cssClass = (field) => {
        let cssClass = "";
        if(this.className(field) === "DATE"){
            cssClass += " calendar";
        }
        return cssClass;
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
        htmlAttr["class"] = this.cssClass(field);
        
        if(this.tag(field) !== "textarea" ){
            htmlAttr["type"] = this.attrType(field);
        }
        
        let htmlAttrString = [];
        for( let key in htmlAttr ){
            if( htmlAttr[key] === ""){
                continue;
            }
            htmlAttrString.push(`"${key}" : "${htmlAttr[key].trim()}"`)
        }
        return  `{ ${htmlAttrString.join(",")} }`;
    }    
    /* for form data*/
    public viewFields = () => {
        let fields = this._fields;
        let viewFields = [];
        for(let key in fields){

            let f = {
                name : key,
                tag : this.tag(fields[key]),
                attr : this.attr(fields[key])
            }
            viewFields.push(f);
        }
        return viewFields;
    }

    public read(file){
    let read = new Promise((resolve , reject) => {
        let td = path.resolve( this._config.templateDirectory);
        let templatePath = td + ds + this._template + ds;
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
    public _overwrite = true;
    set overwrite (status:boolean) {
        this._overwrite = status;
    }

    public fileAccess = (file) =>  {
    let fileAccess = new Promise( (resolve,reject) => {
        fs.access(file ,function(err){
            if(err){
                resolve(false);
                return
            }
            resolve(true);
        })
    } )
    return fileAccess;
    }
    
    public create = ( str ,file ) => {
    let create = new Promise((resolve) => {
        let data =  this.data;
        data["action"] = file.split(ds).pop().split(".").shift();
        let source = ejs.render(str, data );
        let outFilename = file.replace(/\.(.*)\.ejs$/,".$1");
        let outDir = path.resolve(this._config.outDirectory)  + ds + this._name;
        let subDir = file.split(ds);
        subDir.pop();
        subDir.join(ds);
        try{
            mkdirp.sync(outDir + ds + subDir);
        }catch(e){
            throw e;
        }
        let out = outDir + ds + outFilename;
        this.fileAccess(out).then(res => {
            if( res === true && this._overwrite === false ){
                console.log(`skip file ${out}`);
                return;
            }
            fs.writeFile(out, source , function (err) {
                if (err) {
                    console.log(err);
                    throw err;
                }
                console.log(`create file ${out}` );
            });
        })
    })
    }
    
    async readCreate( file ){
        let str = await this.read(file);
        return this.create(str,file);
    }
    
    public templates = () => {
        let templates = new Promise((resolve,reject) => {
            let td = this._config.templateDirectory + ds + this._template;
            td = path.resolve(td) + ds;
            let d = `${td}**${ds}*.ejs`;
            glob( d , {} , function (er, files) {
                if(er){
                    reject();
                }
                for(let key in files){
                    files[key] = files[key].replace(td, "");
                }
                resolve(files);
            })
        })
        return templates;
    }

    async build(){
        let templates = await this.templates();
        for (let key in templates) {
            this.readCreate(templates[key]);
        }
        return true;
    }


}

interface config{
    modelDirectory : string;
    templateDirectory : string;
    outDirectory : string;
}
