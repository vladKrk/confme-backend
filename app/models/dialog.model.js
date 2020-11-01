module.exports = (sequelize, Sequelize) => {

    const Dialog = sequelize.define('dialog', {
        firstUser_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        secondUser_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        unread: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        lastMessage_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        sender_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    }, {
        tableName: 'dialogs'
    });

    return Dialog;
}