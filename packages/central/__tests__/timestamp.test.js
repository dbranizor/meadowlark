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
      done();
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

  it("when remote sends time stamp if timestamp is older then set TS to local", (done) => {
    const oneMinuteAgo = new Date(new Date() - 1 * 60000);
    let spy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => oneMinuteAgo.getTime());
    const remTS = new MutableTimestamp(Date.now(), 0, "testThere");
    spy.mockReset();
    setTimeout(() => {
      const locTS = new MutableTimestamp(Date.now(), 0, "testHere");
      // recSpy.mockRestore();
      const nowTS = locTS.receive({ timestamp: locTS }, remTS);
      expect(nowTS.millis()).toEqual(locTS.millis());
      expect(nowTS.counter()).toEqual(0);
      done();
    }, 100);
  });

  it("when remote sends time stamp if timestamp is newer then set ts to remote and bump counter", () => {
    const remoteTSOne = new MutableTimestamp(Date.now(), 0, "testThere");
    const remoteTSTwo = new MutableTimestamp(Date.now(), 0, "testThere");

    const oneMinuteAgo = new Date(new Date() - 1 * 60000);
    let spy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => oneMinuteAgo.getTime());

    const localTS = new MutableTimestamp(Date.now(), 0, "testHere");
    const receivedFastTS = localTS.receive({ timestamp: localTS }, remoteTSOne);
    const receivedFastTSTwo = localTS.receive(
      {
        timestamp: new MutableTimestamp(
          receivedFastTS.millis(),
          receivedFastTS.counter(),
          receivedFastTS.node()
        ),
      },
      remoteTSTwo
    );
    expect(receivedFastTS.millis()).toEqual(remoteTSOne.millis());
    expect(receivedFastTS.counter()).toEqual(1);
    expect(receivedFastTSTwo.millis()).toEqual(remoteTSTwo.millis());
    expect(receivedFastTSTwo.counter()).toEqual(2);
    spy.mockReset();

    const localTSNow = new MutableTimestamp(Date.now(), 0, "testHere");
    const receivedCurrentTS = localTS.receive(
      { timestamp: localTSNow },
      remoteTSOne
    );

    expect(receivedCurrentTS.millis()).toEqual(localTSNow.millis());
    expect(receivedCurrentTS.counter()).toEqual(0);
  });

  it("when timestamp is set if hash method is ran the value is a repeatable hash", () => {
    const timestamp = new MutableTimestamp(Date.now(), 0, "timestamp");

    const hashOne = timestamp.hash();
    const hashTwo = timestamp.hash();
    expect(hashOne).toBeDefined();
    expect(hashTwo).toBeDefined();
    expect(hashOne).toEqual(hashOne);

    const timestampReceived = timestamp.send({
      timestamp: new MutableTimestamp(Date.now(), 0, "timestamp"),
    });
    const hashThree = timestampReceived.hash();
    const hashFour = timestampReceived.hash();
    expect(hashThree).toBeDefined();
    expect(hashFour).toBeDefined();
    expect(hashThree === hashFour).toBeTruthy();
    expect(hashThree === hashOne).toBeFalsy();
  });
});
