//-------- Requires -----------//
const express = require("express"),
  app = express(),
  server = require("http").createServer(app);

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
  await db.sequelize.sync({force: true});
  console.log("=========Resynced database==========");

  createTags();

  const email = "vlad@mail.ru",
    password = "123456",
    name = "vlad",
    surname = "zhavoronkov";

  await db.user.create(
    {
      email: email,
      password: password,
      personal: {
        name: name,
        surname: surname,
      },
      tags: [
          {name: 'C++'},
          {name: 'Python'}
      ]
    },
    {
      include: [db.personal, db.tag]
    }
  );
})();

async function createTags() {
  await db.tag.create({ name: "Java" });
  await db.tag.create({ name: "Python" });
  await db.tag.create({ name: "C++" });
  await db.tag.create({ name: "DevOps" });
  await db.tag.create({ name: "SRE" });
  await db.tag.create({ name: "PHP" });
}

/*io.on('connection', client => {
    client.on('registration', data => {
        const name = data.name,
            surname = data.surname,
            email = data.email,
            password = data.password;

        
    });
});*/
