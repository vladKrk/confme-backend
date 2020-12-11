exports.SUCCESS = (mes = "") => {
  return JSON.stringify({ status: "success", data: mes });
};
exports.ERROR = (mes = "") => {
  return JSON.stringify({ status: "error", data: mes });
};