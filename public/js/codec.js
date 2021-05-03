/**
 * @file encrypt/decrypt text content.
 * @author Daniel Wolf
 */

const KEY_SIZE = 256;
const PBKD2_ITER = 1000;
const TAG = 'trustpad';
const TAG_SIZE = 64;

class Codec {
    passphrase;

    /**
     * @param {string} passphrase The secret passphrase
     */
    constructor(passphrase) {
      this.passphrase = passphrase;
    }

    /**
     * @param {string} plaintext The string to encrypt
     */
    encrypt(plaintext) {
        let iv = sjcl.random.randomWords(4, 0);
        let salt = sjcl.random.randomWords(2, 0);
        let key = sjcl.misc.pbkdf2(this.passphrase, salt, PBKD2_ITER, KEY_SIZE, sjcl.misc.hmac);
        let prp = new sjcl.cipher.aes(key);
        let data = sjcl.codec.utf8String.toBits(plaintext);
        let encrypted = sjcl.mode.ccm.encrypt(prp, data, iv, TAG, TAG_SIZE);

        let params = {
          'encrypted': sjcl.codec.base64.fromBits(encrypted),
          'iv': sjcl.codec.base64.fromBits(iv),
          'salt': sjcl.codec.base64.fromBits(salt),
          'pbkdf2Iter': Codec.PBKD2_ITER,
          'keySize': KEY_SIZE,
          'tagSize': TAG_SIZE
        };
        return JSON.stringify(params);
    }

    /**
     * @param {string} data The encoded data previously returned by encrypt()
     */
    decrypt(data) {
        let params = JSON.parse(data);
        let iv = sjcl.codec.base64.toBits(params.iv);
        let salt = sjcl.codec.base64.toBits(params.salt);
        let iter = params.pbkdf2Iter;
        let keySize = params.keySize;
        let tagSize = params.tagSize;
        let key = sjcl.misc.pbkdf2(this.passphrase, salt, iter, keySize, sjcl.misc.hmac);
        let prp = new sjcl.cipher.aes(key);
        let ciphertext = sjcl.codec.base64.toBits(params.encrypted);

        try {
            let decrypted = sjcl.mode.ccm.decrypt(prp, ciphertext, iv, TAG, tagSize);
            return sjcl.codec.utf8String.fromBits(decrypted);
        } catch (err) {
            console.log('Decryption failed');
            return null;
        }
    }
}




