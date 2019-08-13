module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('meetups', 'subscriptions', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
      defaultValue: [],
    });
  },

  down: queryInterface => {
    return queryInterface.removeColumn('meetups', 'subscriptions');
  },
};
