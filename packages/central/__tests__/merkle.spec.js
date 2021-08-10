import { MutableTimestamp } from "../src/timestamp";
import { build, diff, insert } from "../src/merkle";
import exp from "constants";

describe("merkle tree", () => {
  it("When a message arrives if there is no merkle then build a merkle", () => {
    const msg1 = new MutableTimestamp(Date.now(), 0, "here");

    const merkle1 = insert({}, msg1);
    const merkle2 = insert({}, msg1);

    expect(merkle1.hash).toBeDefined();
    expect(merkle1.hash).toEqual(merkle2.hash);
  });

  it("When a merkle arrives if merkle is different the the hash will not match", () => {
    const msg1 = new MutableTimestamp(Date.now(), 0, "here");
    const msg2 = new MutableTimestamp(Date.now(), 0, "there");

    const merkle1 = insert({}, msg1);
    const merkle2 = insert({}, msg1);

    const merkle3 = insert(merkle2, msg2);
    const merkle4 = insert(merkle1, msg2);

    expect(merkle1.hash).toBeDefined();
    expect(merkle1.hash).toEqual(merkle2.hash);

    expect(merkle1.hash === merkle3.hash).toBeFalsy();
    expect(merkle3.hash === merkle4.hash).toBeTruthy();
  });

  it("should build a merkle from a list of messages", () => {
    const remoteTSOne = new MutableTimestamp(Date.now(), 0, "testThere");
    const remoteTSTwo = new MutableTimestamp(Date.now(), 0, "testHere");
    const remoteTSThree = new MutableTimestamp(Date.now(), 0, "testSomeWhere");

    const merkle = build([remoteTSOne, remoteTSTwo]);
    const merkleTwo = build([remoteTSOne, remoteTSTwo, remoteTSThree]);

    expect(merkle.hash).toBeDefined();
    expect(merkleTwo.hash !== merkle.hash).toBeTruthy();
  });

  it("when a merkle arrives if it is different then the diverged timestamp can be returned", () => {
    const remoteTSOne = new MutableTimestamp(Date.now(), 0, "testThere");
    const remoteTSTwo = new MutableTimestamp(Date.now(), 0, "testThere");

    const oneMinuteAgo = new Date(new Date() - 1 * 60000);

    let spy = jest
      .spyOn(Date, "now")
      .mockImplementation(() => oneMinuteAgo.getTime());

    const remoteTSThree = new MutableTimestamp(Date.now(), 0, "testThere");

    spy.mockReset();

    const notSyncedMerkle = insert({}, remoteTSThree);
    const syncedMerkle = build([remoteTSThree, remoteTSOne, remoteTSTwo]);

    const diffTime = diff(notSyncedMerkle, syncedMerkle);
    expect(diffTime).toBeDefined();
  });
});
