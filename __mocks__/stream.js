// Mock stream module for Jest compatibility with Bun
module.exports = {
  Readable: class MockReadable {
    constructor() {}
    pipe() { return this; }
    on() { return this; }
    once() { return this; }
    emit() { return false; }
  },
  Writable: class MockWritable {
    constructor() {}
    write() { return true; }
    end() { return this; }
    on() { return this; }
    once() { return this; }
  },
  Transform: class MockTransform {
    constructor() {}
    pipe() { return this; }
    write() { return true; }
    end() { return this; }
    on() { return this; }
    once() { return this; }
  },
  Duplex: class MockDuplex {
    constructor() {}
    pipe() { return this; }
    write() { return true; }
    end() { return this; }
    on() { return this; }
    once() { return this; }
  },
  PassThrough: class MockPassThrough {
    constructor() {}
    pipe() { return this; }
    write() { return true; }
    end() { return this; }
    on() { return this; }
    once() { return this; }
  }
}; 