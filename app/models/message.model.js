module.exports = (sequelize, Sequelize) => {

    const Message = sequelize.define('message', {
        text: {
            type: Sequelize.STRING,
            allowNull: false
        },
        sender_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        reciever_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        read: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
    },{
        tableName: 'messages'
    })
    return Message;
}