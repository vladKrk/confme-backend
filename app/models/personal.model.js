module.exports = (sequelize, Sequelize) => {

    const Personal = sequelize.define('personal', {
        name: Sequelize.STRING,
        surname: Sequelize.STRING,
        phone: Sequelize.STRING,
        location: Sequelize.STRING,
        profession: Sequelize.STRING,
        company: Sequelize.STRING,
        purpose: Sequelize.STRING,
        age: Sequelize.INTEGER,
        photo_path: Sequelize.STRING,
        role: Sequelize.STRING,

    }, {
        tableName: 'personal'
    });

    return Personal;
  };