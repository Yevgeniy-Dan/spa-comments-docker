class CommentMap extends Map {
  constructor() {
    super();
    this.hashMap = new Map();
  }

  set(key, value) {
    // const keyHash = JSON.stringify(key);

    // super.set(keyHash, value);

    super.set(key, value);
    this.hashMap.set(key, value);
  }

  //   get(key) {
  //     const keyHash = JSON.stringify(key);
  //     return super.get(keyHash);
  //   }

  getById(id) {
    for (let [key, value] of this.hashMap) {
      if (key.id === id) {
        return value;
      }
    }
    return null;
  }

  getKeyById(id) {
    for (let [key, value] of this.hashMap) {
      if (key.id === id) {
        return key;
      }
    }
    return null;
  }

  //   has(key) {
  //     const keyHash = JSON.stringify(key);
  //     return super.has(keyHash);
  //   }

  hasById(id) {
    for (let key of this.hashMap.keys()) {
      if (key.id === id) {
        return true;
      }
    }
    return false;
  }

  delete(key) {
    const keyHash = JSON.stringify(key);
    this.hashMap.delete(keyHash);
    return super.delete(keyHash);
  }

  forEach(callback, thisArgs) {
    this.hashMap.forEach((key, value) => {
      callback.call(thisArgs, value, key);
    });
  }
}

module.exports = CommentMap;
