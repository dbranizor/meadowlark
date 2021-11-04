let config = {};

const logger = (config = { logging: "debug" }) =>
  config.logging === "debug" ? console.log : () => {};

const objIsEmpty = (obj) => {
  if (!obj) {
    return null;
  }
  if (Object.keys(obj).length > 0) {
    return false;
  }
  return true;
};
const v4 = () => {
  let s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  )
    .replace(/-/g, "")
    .slice(-16);
};

const makeClientId = (wDashes = false) => {
  return v4().replace(/-/g, "").slice(-16);
};

export { logger, makeClientId, objIsEmpty };
