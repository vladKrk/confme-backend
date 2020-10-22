module.exports = (sequelize, Sequelize) => {
    
    const User = sequelize.define('user', {
        email: {
            type: Sequelize.STRING,
            allowNull: false
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        }
    }, {
        tableName: 'users'
    });

    return User;
  };