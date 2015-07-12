/**
 * @param {string} passphrase The secret passphrase
 */
function Codec(passphrase) {
  this.passphrase = passphrase;
}

Codec.KEY_SIZE = 256;
Codec.PBKD2_ITER = 1000;
Codec.TAG = 'trustpad';
Codec.TAG_SIZE = 64;

/**
 * @param {string} plaintext The string to encrypt
 */
Codec.prototype.encrypt = function(plaintext) {
    var iv = sjcl.random.randomWords(4, 0);
    var salt = sjcl.random.randomWords(2, 0);
    var key = sjcl.misc.pbkdf2(this.passphrase, salt, Codec.PBKD2_ITER, Codec.KEY_SIZE, sjcl.misc.hmac);
    var prp = new sjcl.cipher.aes(key);
    var data = sjcl.codec.utf8String.toBits(plaintext);
    var encrypted = sjcl.mode.ccm.encrypt(prp, data, iv, Codec.TAG, Codec.TAG_SIZE);

    var params = {
      'encrypted': sjcl.codec.base64.fromBits(encrypted),
      'iv': sjcl.codec.base64.fromBits(iv),
      'salt': sjcl.codec.base64.fromBits(salt),
      'pbkdf2Iter': Codec.PBKD2_ITER,
      'keySize': Codec.KEY_SIZE,
      'tagSize': Codec.TAG_SIZE
    };
    return JSON.stringify(params);
};

/**
 * @param {string} data The encoded data previously returned by encrypt()
 */
Codec.prototype.decrypt = function(data) {
    var params = JSON.parse(data);
    var iv = sjcl.codec.base64.toBits(params.iv);
    var salt = sjcl.codec.base64.toBits(params.salt);
    var iter = params.pbkdf2Iter;
    var keySize = params.keySize;
    var tagSize = params.tagSize;
    var key = sjcl.misc.pbkdf2(this.passphrase, salt, iter, keySize, sjcl.misc.hmac);
    var prp = new sjcl.cipher.aes(key);
    var ciphertext = sjcl.codec.base64.toBits(params.encrypted);

    try {
        var decrypted = sjcl.mode.ccm.decrypt(prp, ciphertext, iv, Codec.TAG, tagSize);
        return sjcl.codec.utf8String.fromBits(decrypted);
    } catch (err) {
        console.log('Decryption failed');
        return null;
    }
};
