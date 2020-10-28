//-------- Константы -----------//
const SUCCESS = (mes = '') => {
  return JSON.stringify({ status: "success", message: mes });
}
const ERROR = (mes = '') => {
  return JSON.stringify({ status: "error", message: mes });
}

//-------- Requires -----------//
const express = require("express"),
  app = express(),
  server = require("http").createServer(app);

const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;

const io = require("socket.io")(server, {
  path: "/",
  serveClient: false,

  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

const jwt = require("jsonwebtoken");

const db = require("./app/models");

const authConfig = require('./app/config/auth.config');

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
  })

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

    //TODO: Insert this to the sequelize 
    const salt = await bcrypt.genSalt(10); //async
    const hashPassword = await bcrypt.hash(password, salt); //async

    try {
      await db.user.create(
        {
          email: email,
          password: hashPassword,
          personal: {
            name: name,
            surname: surname,
          },
        },
        {
          include: db.personal,
        }
      );
      callBack(SUCCESS());
    } catch (err) {
      callBack(ERROR());
    }
  });

  client.on("authentication", async (data, callBack) => {
    const email = data.email,
          password = data.password;
    const currentUser = await db.user.findOne({
      where: {
        email: email
      }
    });

    if(!currentUser) {
      callBack(ERROR('User doesn`t exist'));
    }
    else {
      const passwordIsValid = await bcrypt.compare(password, currentUser.password);
      if(!passwordIsValid) {
        callBack(ERROR('Password isn`t valid'));
      }
      else {
        const token = await jwt.sign({id: currentUser.dataValues.id}, authConfig.secret, {
          expiresIn: 86400
        });
        callBack(SUCCESS({
          id: currentUser.dataValues.id,
          name: currentUser.dataValues.name,
          surname: currentUser.dataValues.surname,
          accessToken: token
        }));
      }
    }
  }
  );
});
