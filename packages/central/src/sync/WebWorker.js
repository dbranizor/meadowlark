import { expose } from "comlink";

class API {
  static add(a, b) {
    return a + b;
  }
}

expose(API);
