class MeadoCrypto {
  constructor() {}
  _key;
  _url;
  get key() {
    return this._key;
  }

  async setKey(options) {
    this._key = await this.makeKey(options);
  }

  async encrypt(content) {
    return await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: new Uint8Array(12) /* don't reuse key! */ },
      this.key,
      new TextEncoder().encode(JSON.stringify(content))
    );
  }

  async setURL(url){
    const objectKey = (await window.crypto.subtle.exportKey("jwk", this.key)).k;
    this._url = url + "#key=" + objectKey;
  }

  async makeKey(
    options = {
      algorith: { name: "AES-GCM", length: 128 },
      exportable: true,
      keyUsage: ["encrypt", "decrypt"],
    }
  ) {
    return await window.crypto.subtle.generateKey(
      options.algorith,
      options.exportable,
      options.keyUsage
    );
  }
}

export default MeadoCrypto;
