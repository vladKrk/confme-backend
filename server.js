//-------- Константы -----------//

// ЗАПРОСЫ
const SUCCESS = (mes = "") => {
  return JSON.stringify({ status: "success", data: mes });
};
const ERROR = (mes = "") => {
  return JSON.stringify({ status: "error", data: mes });
};

// ДИАЛОГИ

const DIALOG_ROOM = (id) => {
  return "Dialog " + id;
};

//-------- Requires -----------//
const express = require("express"),
  app = express(),
  server = require("http").createServer(app);

const PORT = process.env.PORT || 3001;

const io = require("socket.io")(server, {
  path: "/",
  serveClient: false,

  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

const jwt = require("jsonwebtoken");

const db = require("./app/models");
const bcrypt = require("bcrypt");

const authConfig = require("./app/config/auth.config");

//-------- Controllers -----------//
const User = require("./app/controllers/user.controller.js");

//------------------------------------

server.listen(PORT, () => {
  console.log("Listening on port: ", PORT);
});

(async () => {
  // Проверяем, подключены ли мы к базе данных
  try {
    await db.sequelize.authenticate();
    console.log("Connection to the database has been established successfully");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
  //Синхронизируем локальные модели с таблицами базы данных
  await db.sequelize.sync({ force: true });
  console.log("=========Resynced database==========");

  createTags();
})();

async function createTags() {
  await db.tag.create({ name: "Java" });
  await db.tag.create({ name: "Python" });
  await db.tag.create({ name: "C++" });
  await db.tag.create({ name: "DevOps" });
  await db.tag.create({ name: "SRE" });
  await db.tag.create({ name: "PHP" });
}

io.on("connection", (client) => {
  console.log("Client connected, id: ", client.id);
  client.on("disconnect", () => {
    console.log("Client disconnected, id: ", client.id);
  });

  /*
    Client-side:
    socket.emit("registration", data = {email, password, name, surname}, (res) => {
      if(res.status === 'success'){ ... }
      if(res.status === 'error){ console.log(res.message) }
    })
  */
  client.on("registration", async (data, callBack) => {
    const name = data.name,
      surname = data.surname,
      email = data.email,
      password = data.password;
      await User.create(email, password, name, surname, callBack);
  });

  client.on("authentication", async (data, callBack) => {
    const email = data.email,
      password = data.password;

    const currentUser = await User.findOne({email: email});

    if (!currentUser) {
      callBack(ERROR("User doesn`t exist"));
    } else {
      const passwordIsValid = await bcrypt.compare(
        password,
        currentUser.dataValues.password
      );
      if (!passwordIsValid) {
        callBack(ERROR("Password isn`t valid"));
      } else {
        const token = await jwt.sign(
          { id: currentUser.dataValues.id },
          authConfig.secret
        );
        callBack(
          SUCCESS({
            id: currentUser.dataValues.id,
            name: currentUser.dataValues.name,
            surname: currentUser.dataValues.surname,
            accessToken: token,
          })
        );
      }
    }
  });

  client.on("signOut", async(data, callBack) => {
    await client.leaveAll();
    callBack(SUCCESS("Sign out succesfully"));
  });

  // Подписка пользователя на сообщения от всех диалогов
  client.on("join", async (data, callBack) => {
    const user_id = data.user_id;
    const userDialogs = await db.dialog.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { firstUser_id: { [db.Sequelize.Op.eq]: user_id } },
          { secondUser_id: { [db.Sequelize.Op.eq]: user_id } },
        ],
      },
    });
    userDialogs.every((dialog) => {
      client.join(DIALOG_ROOM(dialog.dataValues.id));
    });
    callBack(SUCCESS("User joined to the chats"));
  });

  //Событие отправления сообщения пользователю
  client.on("message", async (data, callBack) => {
    const sender_id = data.sender_id,
      reciever_id = data.reciever_id,
      text = data.text;

    const newMessage = await db.message.create({
      text: text,
      sender_id: sender_id,
      reciever_id: reciever_id,
      read: 0,
    });

    let currentDialog = await db.dialog.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          {
            firstUser_id: { [db.Sequelize.Op.eq]: sender_id },
            secondUser_id: { [db.Sequelize.Op.eq]: reciever_id },
          },
          {
            firstUser_id: { [db.Sequelize.Op.eq]: reciever_id },
            secondUser_id: { [db.Sequelize.Op.eq]: sender_id },
          },
        ],
      },
    });
    if (!currentDialog) {
      currentDialog = await db.dialog.create({
        firstUser_id: sender_id,
        secondUser_id: reciever_id,
        unread: 1,
        sender_id: sender_id,
        lastMessage_id: newMessage.id,
      });
      // Если новый диалог, добавим пользователя в отслеживание сообщений от этого диалога
      client.join(DIALOG_ROOM(currentDialog.id));
      io.to(DIALOG_ROOM(currentDialog.id)).emit("dialogSubscribe", {
        data: {
          ...currentDialog.dataValues,
        },
      });
    } else {
      if (currentDialog.sender_id === sender_id) {
        await currentDialog.increment("unread");
      } else {
        currentDialog.sender_id = sender_id;
        currentDialog.unread = 1;
      }
      currentDialog.lastMessage_id = newMessage.id;
      await currentDialog.save();
    }
    await newMessage.setDialog(currentDialog);

    io.to(DIALOG_ROOM(currentDialog.id)).emit("messageSubscribe", {
      data: {
        ...newMessage.dataValues,
      },
    });
    callBack(SUCCESS("Message sent"));
  });

  client.on("readDialog", async (data, callBack) => {
    const dialog_id = data.dialog_id,
      user_id = data.user_id;
    let currentDialog = await db.dialog.findOne({
      where: {
        id: dialog_id,
      },
    });
    if (!currentDialog) {
      callBack(ERROR("This dialog doesnt exist"));
    } else {
      if (currentDialog.sender_id === user_id) {
        callBack(SUCCESS("Nothing new to read"));
      } else {
        currentDialog.unread = 0;
        await currentDialog.save();
        callBack(SUCCESS("Read dialog successfully"));
      }
      client.broadcast
      .to(DIALOG_ROOM(currentDialog.id))
      .emit("readDialogSubscribe", {
        // need test
        data: {
          dialog_id: dialog_id, //Отправляем участникам диалога сообщение, что диалог с таким id был прочитан
        },
      });
    }
  
  });

  //Отправить клиенту все диалоги указанного пользователя
  client.on("fetchDialogs", async (data, callBack) => {
    const user_id = data.user_id;
    const dialogs = await db.dialog.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          {
            firstUser_id: { [db.Sequelize.Op.eq]: user_id },
          },
          {
            secondUser_id: { [db.Sequelize.Op.eq]: user_id },
          },
        ],
      },
    });
    callBack(SUCCESS(dialogs));
  });

  client.on("fetchDialog", async (data, callBack) => {
    if (data.dialog_id) {
      const dialog_id = data.dialog_id;
      const dialog = await db.dialog.findOne({
        where: {
          id: dialog_id,
        },
      });
      callBack(SUCCESS(dialog));
    } else {
      const userId = data.user_id,
        friendId = data.friend_id;
      const dialog = await db.dialog.findOne({
        where: {
          [db.Sequelize.Op.or]: [
            {
              firstUser_id: { [db.Sequelize.Op.eq]: userId },
              secondUser_id: { [db.Sequelize.Op.eq]: friendId },
            },
            {
              firstUser_id: { [db.Sequelize.Op.eq]: friendId },
              secondUser_id: { [db.Sequelize.Op.eq]: userId },
            },
          ],
        },
      });
      callBack(SUCCESS(dialog));
    }
  });

  // Отправить клиенту все сообщения указаного диалога
  client.on("fetchMessages", async (data, callBack) => {
    const dialog_id = data.dialog_id;
    const messages = await db.message.findAll({
      where: {
        dialogId: dialog_id,
      },
    });
    callBack(SUCCESS(messages));
  });

  client.on("fetchMessage", async (data, callBack) => {
    const message_id = data.message_id;
    const message = await db.message.findOne({
      where: {
        id: message_id,
      },
    });
    callBack(SUCCESS(message));
  });

  // Отправить клиенту всех пользователей
  client.on("fetchUsers", async (data, callBack) => {
    const users = await User.findAll(callBack);
    callBack(SUCCESS(users));
  });

  // Отправить клиенту пользователя с указанными id
  client.on("fetchUser", async (data, callBack) => {
    const user_id = data.user_id;
    const user = await User.findOne({id: user_id});
    callBack(SUCCESS(user));
  });

  client.on("fetchPersonals", async (data, callBack) => {
    const personals = await db.personal.findAll();
    callBack(SUCCESS(personals));
  });

  client.on("fetchPersonal", async (data, callBack) => {
    const user_id = data.user_id;
    const personal = await db.personal.findOne({
      where: {
        userId: user_id,
      },
    });
    callBack(SUCCESS(personal));
  });

  client.on("countDialogs", async (data, callBack) => {
    const count = await db.dialog.count();
    callBack(SUCCESS(count));
  });
});
