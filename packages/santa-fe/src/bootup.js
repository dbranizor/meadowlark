import Message from "./components/messages/message-state";
const MessageCatalog = {
  Message,
};
const localized = async function (components) {
  const args = Array.prototype.slice.call(arguments);
  await args.reduce(async (acc, curr) => {
    const prev = await acc;
    console.log("dingo localized called", curr);
    await MessageCatalog[curr].init();
    return prev;
  }, Promise.resolve());
};

export { localized, MessageCatalog };
