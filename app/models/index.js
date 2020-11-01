const config = require("../config/db.config.js");

const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: config.logging,
    storage: config.storage,
  }
);
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model")(sequelize, Sequelize);
db.personal = require("./personal.model")(sequelize, Sequelize);
db.tag = require("./tag.model")(sequelize, Sequelize);
db.dialog = require("./dialog.model")(sequelize, Sequelize);
db.message = require("./message.model")(sequelize, Sequelize);

db.user.hasOne(db.personal);
db.personal.belongsTo(db.user);

db.user.belongsToMany(db.tag, {through: 'personal_tags'});
db.tag.belongsToMany(db.user, {through: 'personal_tags'});

db.dialog.hasMany(db.message);
db.message.belongsTo(db.dialog);

module.exports = db;
