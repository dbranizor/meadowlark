"use strict";

import { Central } from "../src/central.js";

describe("central", () => {
  it("murmurhash", () => {
    const val = "hash this";
    const central = new Central();
    const hash = central.get(val);
    expect(hash).toBeDefined();
  });
});
