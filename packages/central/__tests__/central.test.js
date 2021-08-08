"use strict";

import {Central} from "../src/central"

describe("central", () => {
  it("murmurhash", () => {
    const val = "hash this";
    const central = new Central();
    const hash = central.get(val);
    expect(hash).toBeDefined()
  });
});
