import { EVENTS } from "./enum";

self.addEventListener("message", (event) => {
  console.log(event);
  switch (event.data) {
    case EVENTS.START_SYNC:
      console.log("WebWorker: StartSync");
      self.postMessage("Sync-Done")
      break;
    case EVENTS.STOP_SYNC:
      console.log("WebWorker: StopSync");
      self.postMessage("Sync-Stopped")
      break;
    default:
      console.log("Error: Debug Problem", event.data);
  }
});


