//-------- Константы -----------//
const SUCCESS = { status: "success" };
const ERROR = { status: "error" };

//-------- Requires -----------//
const express = require("express"),
  app = express(),
  server = require("http").createServer(app);

const bcrypt = require("bcrypt");

const PORT = process.env.PORT || 3000;

const io = require("socket.io")(server, {
  path: "/app",
  serveClient: false,

  pingInterval: 10000,
  pingTimeout: 5000,
  cookie: false,
});

const db = require("./app/models");
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

  // const email = "vlad@mail.ru",
  //   password = "123456",
  //   name = "vlad",
  //   surname = "zhavoronkov";

  //   const salt = await bcrypt.genSalt(10); //async
  //   const hashPassword = await bcrypt.hash(password, salt); //async
  // const currentUser = await db.user.create(
  //   {
  //     email: email,
  //     password: hashPassword,
  //     personal: {
  //       name: name,
  //       surname: surname,
  //     },
  //   },
  //   {
  //     include: db.personal
  //   }
  // );
  // const ntag = await db.tag.findOne({where: {name: 'C++'}});
  // await currentUser.addTag(ntag);
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
      callBack(JSON.stringify(SUCCESS));
    } catch (err) {
      callBack(JSON.stringify(ERROR));
    }
  });
});
