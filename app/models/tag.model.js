module.exports = (sequelize, Sequelize) => {

    const Tag = sequelize.define('tag', {
        name: Sequelize.STRING
    }, {
        tableName: 'tags'
    })

    return Tag;
  };