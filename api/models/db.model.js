class DbModel{

    constructor(props){
        this.assign(props);
    }
    
    assign = (props) => {
        const schema = this.getSchema();
        Object.keys(schema).forEach(col=>{
            this[col] = schema[col].default;
        })
        for (const key in props) {
            if (!schema.hasOwnProperty(key)) {
                delete props[key];
                continue;
            }
            if(schema[key].type === 'boolean'){
                props[key] = props[key] !== null ? (props[key] === '1') : null;
            }
            else if(schema[key].type === 'number'){
                props[key] = props[key] !== null ? (+props[key]) : null;
            }
            else if(schema[key].type === 'date'){
                props[key] =  props[key] !== null ? (new Date( props[key])) : null;
            }
            else{
                props[key] = props[key] !== null ? (props[key]) : null;
            }
        }
        Object.assign(this, props);
    }
    
    getSchema = () => {
        const schema = require(`../schemas/${this.constructor.name.unCamelize()}.json`);
        return schema
    }
    static getSchema = (name) => {
        const schema = require(`../schemas/${name.unCamelize()}.json`);
        return schema
    }

    getProps = () => {
        const properties = JSON.parse(JSON.stringify(this));
        return properties
    }

    getSqlProps = () => {
        let properties = this.getProps();
        let schema = this.getSchema();
        for (const key in properties) {
            if(schema[key].type === 'boolean'){
                properties[key] = properties[key] !== null ? (+properties[key]) : "null";
            }
            else if(schema[key].type === 'number'){
                properties[key] = properties[key] !== null ? (+properties[key]) : "null";
            }
            else if(schema[key].type === 'date'){
                properties[key] =  properties[key] !== null ? properties[key].toISOString() : "null";
            }
            else{
                properties[key] = properties[key] !== null ? (`'${properties[key].replace("'","''")}'`) : "null";
            }
        }
        return properties;
    }

    static from(obj){
        if(Array.isArray(obj)){
            return obj.map(item => new this(item));
        }
        else if(typeof obj == "object"){
            return new this(obj);
        }
        return;
    }

    static toSqlProps(props){
        const schema = DbModel.getSchema(this.name);
        for (const key in props) {
            if (!schema.hasOwnProperty(key)) {
                delete props[key];
                continue;
            }
            if(schema[key].type === 'boolean'){
                props[key] = props[key] !== null ? (+props[key]) : "null";
            }
            else if(schema[key].type === 'number'){
                props[key] = props[key] !== null ? (+props[key]) : "null";
            }
            else if(schema[key].type === 'date'){
                props[key] =  props[key] !== null ? props[key].toISOString() : "null";
            }
            else{
                props[key] = props[key] !== null ? (`'${props[key].replace("'","''")}'`) : "null";
            }
        }
        return props;
    }

}

module.exports = DbModel;