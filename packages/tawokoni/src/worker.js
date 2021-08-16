self.addEventListener("message", (event) => {
  console.log(event);
  switch (event.data.msg) {
    case "APPLY":
      console.log("WebWorker: StartSync");
    // self.postMessage("Sync-Done");
    // break;
    case "STOP_SYNC":
      console.log("WebWorker: StopSync");
      self.postMessage("Sync-Stopped");
      break;
    case "ADD_SCHEMA":
      console.log("WebWorker: AddingSchema");
      // SchemaStore.add(event.data.payload);
      console.log("WebWOrker Added Schema", event.data.payload);
    case "ADD_GROUP":
      console.log("WebWorker Added Group: ", event.data.payload);
      // GroupStore.add({
      //   id: event.data.payload,
      //   name: event.data.payload,
      //   clock: Timestamp.makeClock(new Timestamp(0, 0, makeClientId(v4))),
      // });
      // SelectionStore.add("group", event.data.payload);
      break;
    default:
      console.log("Error: Debug Problem", event.data);
  }
});
