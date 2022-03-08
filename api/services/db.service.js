const mysql = require("mysql");
const config = require("../configs")("db");

class DbService {
  constructor() {
    this.name = this.constructor.name.replace(`Service`, ``);
    this.table = this.name.unCamelize();
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
      const schemasDirectory = `api/schemas`;
      if (!fs.existsSync(schemasDirectory)) {
        fs.mkdirSync(schemasDirectory);
      }
      const file = `${schemasDirectory}/${table.name}.json`;
      fs.writeFileSync(file, JSON.stringify(columns, null, 2));
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
}

module.exports = DbService;
