import { Timestamp, MutableTimestamp } from "../src/central";
describe("timestamp", () => {
  it("should create timestamp", () => {
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
    const spy = jest
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
    spy.mockRestore();
    jest.setTimeout(500);
    const clockNow = {
      timestamp: new MutableTimestamp(Date.now(), 0, "test", {
        maxDrift: 80000,
      }),
    };
    const timestampNowWallCurrent = timestampSlow.send(clockNow);
    console.log("dingo", timestampNowWallCurrent.counter());
    expect(timestampNowWallCurrent.counter()).toEqual(0);
  });

  it("should receive a timestamp", () => {
    const timestamp = new MutableTimestamp(
      new Date().toISOString(),
      0,
      "test",
      {
        maxDrift: 80000,
      }
    );

    const receivingTimestamp = new MutableTimestamp(
      new Date().toISOString(),
      0,
      "testRemote",
      {
        maxDrift: 80000,
      }
    );

    const receivedTimestamp = timestamp.recieve(
      { timestamp: timestamp },
      receivingTimestamp
    );

    expect(receivedTimestamp.millis() === receivingTimestamp.millis());
  });
});
