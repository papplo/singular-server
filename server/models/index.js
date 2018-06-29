'use strict';

const fs        = require('fs');
const path      = require('path');
const Sequelize = require('sequelize');
const basename  = path.basename(__filename);
const db        = {};
require('dotenv').config({path:__dirname+'/./../../.env'});

const dbPort = process.env.DB_PORT || 3306;

// use this line if you are hosting the database
// const hostIp = process.env.SERVER_IP;

// use this line if you are connecting to local network database
const hostIp = process.env.LOCAL_SERVER_IP;

const sequelize = new Sequelize('skill_x_change_db', process.env.DB_USER, process.env.DB_PASSWORD, {
  host: hostIp,
  dialect: 'mysql',
  port: dbPort,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
