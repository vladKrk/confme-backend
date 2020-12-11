const db = require("../models");

const SUCCESS = require("../constants").SUCCESS;
const ERROR = require("../constants").ERROR;

const bcrypt = require("bcrypt");

const User = db.user;
const Tag = db.tag;
const Personal = db.personal;
const Op = db.Sequelize.Op;

exports.create = async (email, password, name, surname, callBack) => {
  if (!email) {
    console.log("Email is null object");
    callBack(ERROR("Bad email"));
    return;
  }
  if (!password) {
    console.log("Password is null object");
    callBack(ERROR("Bad password"));
    return;
  }
  if (!name) {
    name = "";
  }
  if (!surname) {
    surname = "";
  }
  try {
    const isUser = await User.findOne({
      where: {
        email: email,
      },
    });
    if (isUser) {
      callBack(ERROR("Such user already exist"));
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    await User.create(
      {
        email: email,
        password: hashPassword,
        personal: {
          name: name,
          surname: surname,
        },
      },
      {
        include: Personal,
      }
    );
    callBack(SUCCESS("User successfully registered"));
  } catch (err) {
    callBack(ERROR("Cannot register user: " + err));
  }
};

exports.findAll = async () => {
  try {
    const users = await db.user.findAll();
    return users;
  } catch (err) {
    callBack(ERROR("Cannot find all users: " + err));
    return "_ERROR_";
  }
};

exports.findOne = async (condition) => {
  try {
    const currentUser = await User.findOne({
      where: condition,
    });
    return currentUser;
  } catch (err) {
    callBack(ERROR("Cannot find user: " + err));
    return "_ERROR_";
  }
};
