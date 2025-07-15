// Mock buffer module for Jest compatibility with Bun
module.exports = {
    Buffer: {
      from: (data) => data,
      alloc: (size) => new Uint8Array(size),
      allocUnsafe: (size) => new Uint8Array(size),
      isBuffer: (obj) => obj instanceof Uint8Array,
    }
  }; 