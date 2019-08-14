import Sequelize from 'sequelize';
import mongoose from 'mongoose';

import User from '../app/models/User';
import File from '../app/models/File';
import Meetup from '../app/models/Meetup';

import databaseConfig from '../config/database';

const models = [User, File, Meetup];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  /**
   * conection with database not relationships
   */
  mongo() {
    this.mongoConnection = mongoose.connect(
      'mongodb://localhost:27017/meetApp',
      {
        useNewUrlParser: true,
        useFindAndModify: true,
      }
    );
  }
}

export default new Database();
