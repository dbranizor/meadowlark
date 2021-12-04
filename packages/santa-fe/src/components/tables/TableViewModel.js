import { bootstrap, MessageBus, writable } from "@meadowlark-labs/central";
import { init } from "svelte/internal";
import MessageModel from "../messages/MessageModel.js";
import TableModel from "./TableModel.js";
const InitTableViewModel = () => {
  const { set, subscribe, update } = writable({});
  const syncReady$ = writable(false);
  let syncReady = false;
  const unsubscribes = [];

  const methods = {
    async init(schema) {
      return new Promise((res, rej) => {
        TableModel.setSchema(schema);
        bootstrap(schema).then(() => {
          syncReady$.update((s) => {
            TableModel.refresh();
            syncReady = true;
            return true;
          });

          unsubscribes.push(
            TableModel.subscribe((res) => {
              console.log("TableViewModel Picked up Update", res);
              set(res[Object.keys(res)[0]] || []);
            }),
            MessageBus.subscribe(async (msg) => {
              if (msg.message === "REFRESH" && msg.payload === "tables") {
                console.log("Caught Tables Refresh...");
                await TableModel.refresh();
                console.log("Refreshed Tables");
              } else {
                console.log("Not Refreshing Tables");
              }
            })
          );

          res(true);
        });
      });
    },
    async addBatch(rows = [], table) {
      if (syncReady) {
        await rows.reduce(async (acc, curr) => {
          const prevAcc = await acc;
          await this.add(curr, table);
          return prevAcc;
        }, Promise.resolve());
      }
    },
    async delete(id, table){
      console.log('Deleting', id);
      TableModel.delete(id, table)
    },
    async add(row, table) {
      await TableModel.insert(row, table);
    },
    async update(row, table) {
      TableModel.update(row, table);
    },
    refresh(name = false) {
      TableModel.refresh(name);
    },
  };

  return {
    unsubscribes,
    subscribe,
    update,
    syncReady$,
    ...methods,
  };
};

const TableViewModel = InitTableViewModel();

export default TableViewModel;
