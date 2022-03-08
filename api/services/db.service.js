const mysql = require("mysql");
const config = require("../configs")("db");

class DbService {
  constructor() {
    this.name = this.constructor.name.replace(`Service`, ``);
    this.table = this.name.unCamelize();
    this.ModelClass = require(`../models/${this.table}.model`);
  }

  static db;
  static connect = () => {
    if (!DbService.db) {
      DbService.db = mysql.createPool({
        host: config.HOST,
        port: config.PORT,
        user: config.USER,
        password: config.PASS,
        database: config.NAME,
      });
    }
    return DbService.db;
  };

  static executeQuery = async (sql, params) => {
    return await new Promise((resolve, reject) => {
      DbService.connect().query(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    }).catch((err) => {
      console.error("DB Error", err);
      return err;
    });
  };
  executeQuery = async (sql, params) => {
    return await DbService.executeQuery(sql, params);
  };

  static getTables = async () => {
    const sql = `SELECT table_name AS name, table_comment AS comment FROM information_schema.tables WHERE table_schema = '${config.NAME}'`;
    return await DbService.executeQuery(sql);
  };

  static initialize = async () => {
    const tables = await DbService.getTables();
    for (const table of tables) {
      const tableColumns = await DbService.executeQuery(`SHOW FULL COLUMNS FROM ${table.name}`);
      const columns = {};
      for (const column of tableColumns) {
        columns[column.Field] = {};
        if(column.Type === 'tinyint(1)'){
            columns[column.Field].type = "boolean";
            columns[column.Field].default = column.Default !== null ? (column.Default === '1') : null;
          }
          else if(column.Type.containsOneOf('int','float','double')){
            columns[column.Field].type = "number";
            columns[column.Field].default = column.Default !== null ? (+`${column.Default}`) : null;
          }
          else if(column.Type.containsOneOf('date','time')){
            columns[column.Field].type = "date";
            columns[column.Field].default = column.Default !== null ? (new Date(column.Default)) : null;
          }
          else{
            columns[column.Field].type = "string";
            columns[column.Field].default = column.Default !== null ? (column.Default) : null;
          }
      }

      const fs = require("fs");
      /** Auto-Generate Schemas */
      const schemasDirectory = `api/schemas`;
      if (!fs.existsSync(schemasDirectory)) {
        fs.mkdirSync(schemasDirectory);
      }
      const file = `${schemasDirectory}/${table.name}.json`;
      fs.writeFileSync(file, JSON.stringify(columns, null, 2));

      /** Auto-Generate Models */
      const modelsDirectory = `api/models`;
      if (!fs.existsSync(modelsDirectory)) {
        fs.mkdirSync(modelsDirectory);
      }
      const modelFile = `api/models/${table.name}.model.js`;
      if(!fs.existsSync(modelFile)){
        const fileContent = fs.readFileSync(`api/helpers/classes_templates/model.txt`).toString().replaceAll("ClassName",table.name.camelize());
        fs.writeFileSync(modelFile, fileContent);
      }

      /** Auto-Generate Services */
      const servicesDirectory = `api/services`;
      if (!fs.existsSync(servicesDirectory)) {
        fs.mkdirSync(servicesDirectory);
      }
      const serviceFile = `api/services/${table.name}.service.js`;
      if(!fs.existsSync(serviceFile)){
        const fileContent = fs.readFileSync(`api/helpers/classes_templates/service.txt`).toString().replaceAll("ClassName",`${table.name.camelize()}Service`);
        fs.writeFileSync(serviceFile, fileContent);
      }

    }
  }

  select = async (params) => {
    let sql = `SELECT * FROM ${this.table} WHERE deleted = ?`;
    if (params?.where) {
      sql += ` AND (${params.where.replace("&&", "AND").replace("||", "OR")})`;
    }
    sql += ";";
    const rows = await DbService.executeQuery(sql, [0]);
    return rows;
  };

  insert = async (params, forceId = false) => {
    if(Array.isArray(params)){
      if(params.length === 0) return null;
      const objects = this.ModelClass.from(params);
      const first = [...objects].pop().getProps();
      if(!forceId) delete first.id;
      const columns = Object.keys(first).join(',');
      let values = [];
      objects.forEach(object => {
        if(!forceId) delete object.id;
        values.push("(" + Object.values(object.getSqlProps()).join(',') + ")");
      })
      values = values.join(',');
      const sql = `INSERT INTO ${this.table} (${columns}) VALUES ${values};`;
      const result = await DbService.executeQuery(sql);
      const rows = await this.select({where:`id >= ${result.insertId} && id < ${result.insertId + result.affectedRows}`});
      return rows.length > 0 ? rows : false;
    }
    else{
      const object = this.ModelClass.from(params);
      if(!forceId) delete object.id;
      const columns = Object.keys(object.getProps()).join(',');
      const values = Object.values(object.getSqlProps()).join(',')
      const sql = `INSERT INTO ${this.table} (${columns}) VALUES (${values});`;
      const result = await DbService.executeQuery(sql);
      const rows = await this.select({where:`id=${result.insertId}`});
      return rows.length === 1 ? rows.pop() : false;
    
    }
  }

  update = async (params) => {
    const where = params.where?.replaceAll('&&','AND').replaceAll('||','OR') || '0';
    const fields = this.ModelClass.toSqlProps(params.fields);
    let values = [];
    for(const key in fields){
        values.push(`${key}=${fields[key]}`);
    }
    values = values.join(',');
    let sql = `UPDATE ${this.table} SET ${values} WHERE ${where};`;
    const result = await DbService.executeQuery(sql);
    return result.affectedRows > 0 ? await this.select({where}) : false;
  }

  delete = async (params) => {
    const where = params.where?.replaceAll('&&','AND').replaceAll('||','OR') || '0';
    let sql = `DELETE FROM ${this.table} WHERE ${where};`;
    const result = await DbService.executeQuery(sql);
    return result.AffectedRows > 0;
  }

}

module.exports = DbService;
