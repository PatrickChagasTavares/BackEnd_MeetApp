import Sequelize, { Model } from 'sequelize';
import { isBefore } from 'date-fns';

class Meetup extends Model {
  static init(sequelize) {
    super.init(
      {
        title: Sequelize.STRING,
        description: Sequelize.TEXT,
        location: Sequelize.STRING,
        times: Sequelize.DATE,
        subscriptions: Sequelize.ARRAY(Sequelize.INTEGER),
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.times, new Date());
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, {
      foreignKey: 'subscriptions',
      as: 'user_subscriptions',
    });
    this.belongsTo(models.File, { foreignKey: 'image_id', as: 'banner' });
  }
}

export default Meetup;
