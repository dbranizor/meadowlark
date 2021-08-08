import { JsxEmit } from "typescript";
import { MutableTimestamp } from "../src/timestamp";
describe("timestamp", () => {
  it("should create timestamp", (done) => {
    const timestamp = new MutableTimestamp(
      new Date().toISOString(),
      0,
      "test",
      {
        maxDrift: 80000,
      }
    );

    expect(timestamp.maxDrift()).toEqual(80000);
    const tenMinutesAgo = new Date(new Date() - 10 * 60000);
    const now = new Date();
    let spy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => tenMinutesAgo.getTime());

    const timestampSlow = new MutableTimestamp(Date.now(), 0, "test", {
      maxDrift: 80000,
    });
    const clockSlow = {
      timestamp: new MutableTimestamp(Date.now(), 0, "test", {
        maxDrift: 80000,
      }),
    };
    expect(clockSlow.timestamp.millis()).toBeDefined();
    const timestampSlowWallClock = timestampSlow.send(clockSlow);
    expect(timestampSlowWallClock.counter()).toEqual(1);
    spy.mockReset();

    setTimeout(() => {
      const clockNow = {
        timestamp: new MutableTimestamp(Date.now(), 0, "test", {
          maxDrift: 80000,
        }),
      };
      const timestampNowWallCurrent = timestampSlow.send(clockNow);
      console.log("dingo", timestampNowWallCurrent.counter());
      expect(timestampNowWallCurrent.counter()).toEqual(0);
      spy.mockClear();
      done()
    }, 1000);
  });

  it("should receive a timestamp", () => {
    const ts = new MutableTimestamp(new Date().toISOString(), 0, "test", {
      maxDrift: 80000,
    });

    console.log("dingo counter", ts.counter());
    const receivingTimestamp = new MutableTimestamp(
      new Date().toISOString(),
      0,
      "testRemote",
      {
        maxDrift: 80000,
      }
    );
    const receivedTimestamp = ts.receive({ timestamp: ts }, receivingTimestamp);
    expect(receivedTimestamp.millis() === receivingTimestamp.millis());
    expect(receivedTimestamp.counter()).toEqual(0);
  });

  it("when remote sends time stamp if timestamp is newer then set TS to remote", () => {
    const remTS = new MutableTimestamp(Date.now(), 0, "testThere");
    const fiveMinutesAgo = new Date(new Date() - 5 * 60000);
    
    // const recSpy = jest
    //   .spyOn(Date, "now")
    //   .mockImplementation(() => fiveMinutesAgo);
    const locTS = new MutableTimestamp(Date.now(), 0, "testHere");
    // recSpy.mockRestore();
    const nowTS = locTS.receive({ timestamp: locTS }, remTS);
    expect(nowTS.millis()).toEqual(remTS.millis());
  });
});
