/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  AES Counter-mode implementation for Web workers in JavaScript       (c) Chris Veness 2005-2014 / MIT Licence  */
/*																		(c) Peter Kolarov 2015
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


'use strict';


/**
 * Aes.Ctr: Counter-mode (CTR) wrapper for AES.
 *
 * This encrypts a Unicode string to produces a base64 ciphertext using 128/192/256-bit AES,
 * and the converse to decrypt an encrypted ciphertext.
 *
 * See http://csrc.nist.gov/publications/nistpubs/800-38a/sp800-38a.pdf
 *
 * @augments Aes
 */
importScripts('js/aes.js');
importScripts('js/sha256.js');
Aes.Ctr = {};


/**
 * Encrypt a text using AES encryption in Counter mode of operation - using web workers
 *
 * Unicode multi-byte character safe
 *
 * @param   {string} plaintext - Source text to be encrypted.
 * @param   {string} password - The password to use to generate a key.
 * @param   {number} nBits - Number of bits to be used in the key; 128 / 192 / 256.
 * @param   {number} iv - IV vector as Uint8Array in length of 8 bytes
 * @returns {string} Encrypted text.
 *
 * @example
 *   var encr = Aes.Ctr.encrypt('big secret', 'pāşšŵōřđ', iv, 256); // encr: 'lwGl66VVwVObKIr6of8HVqJr'
 */

Aes.Ctr.encrypt = function (plaintext, password, iv, nBits) {
    var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
    if (!(nBits == 128 || nBits == 192 || nBits == 256)) return ''; // standard allows 128/192/256 bit keys

    // use AES itself to encrypt password to get cipher key (using plain password as source for key
    // expansion) - gives us well encrypted key (though hashed key might be preferred for prod'n use)
    var nBytes = nBits / 8;  // no bytes in key (16/24/32)
    var keyHexString = Sha256.hash(password);
    var key = parseHexString(keyHexString);
    key = key.slice(0, nBytes); // shrink key for smaller ciphers

    // setup counter block using 8 byte IV vector using strong crypto RND passed in
    var counterBlock = Array.prototype.slice.call(iv).concat(new Array(8));// create first 8 bytes random and the other 8 zero filled

    // write counter block first as a 16 byte IV vector
    var objData = {count: 0, total: 0, cypherBlock: counterBlock};
    self.postMessage(objData)  // dont send as transfer object - copy data to another buffer

    // generate key schedule - an expansion of the key into distinct Key Rounds for each round
    var keySchedule = Aes.keyExpansion(key);
    var blockCount = Math.ceil(plaintext.length / blockSize);
    var xferCounter = 0;//, xferByteCount = 0;
    var cipherXFERBuffer = new Uint8Array(0); // web worker transfer buffer - transfer back 10 blocks at a time
    for (var b = 0; b < blockCount; b++) {
        // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
        // done in two stages for 32-bit ops: using two words allows us to go past 2^32 blocks (68GB)
        for (var c = 0; c < 4; c++) counterBlock[15 - c] = (b >>> c * 8) & 0xff;
        for (var c = 0; c < 4; c++) counterBlock[15 - c - 4] = (b / 0x100000000 >>> c * 8);
        var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // -- encrypt counter block --
        // block size is reduced on final block
        var blockLength = b < blockCount - 1 ? blockSize : (plaintext.length - 1) % blockSize + 1;
        var cipherChar = new Uint8Array(blockLength);
        for (var i = 0; i < blockLength; i++) {  // -- xor plaintext with ciphered counter char-by-char --
            cipherChar[i] = cipherCntr[i] ^ plaintext.charCodeAt(b * blockSize + i);
        }
        cipherXFERBuffer = concatTyped(cipherXFERBuffer, cipherChar); // optimize this by moving it up
        xferCounter += 1;
        if (xferCounter == 10) {
            // min 10 blocks reached  so send out data
            var objData = {count: b, total: blockCount, cypherBlock: cipherXFERBuffer};
            self.postMessage(objData, [objData.cypherBlock.buffer]); // send as transfer object
            cipherXFERBuffer = new Uint8Array(0); // create new xfer buffer
            xferCounter = 0;
        }
    }
    if (xferCounter != 0) { //send out leftover buffer + 32byte key attached at
        var objData = {count: blockCount, total: blockCount, cypherBlock: cipherXFERBuffer};
        self.postMessage(objData, [objData.cypherBlock.buffer]); // send as transfer object
    }
    // send encryption is fininshed message
    var objData = {count: -1, total: -1};
    self.postMessage(objData)
};


function parseHexString(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function concatTyped(a, b) {
    var c = new Uint8Array(a.length + b.length);
    for (var i = 0; i < a.length; i++) {
        c[i] = a[i]
    }
    for (var i = 0; i < b.length; i++) {
        c[i + a.length] = b[i];
    }
    return c;
}

/**
 * Decrypt a text encrypted by AES in counter mode of operation
 *
 * @param   {string} ciphertext - Source text to be encrypted.
 * @param   {string} password - Password to use to generate a key.
 * @param   {number} nBits - Number of bits to be used in the key; 128 / 192 / 256.
 * @returns {string} Decrypted text
 *
 * @example
 *   var decr = Aes.Ctr.encrypt('lwGl66VVwVObKIr6of8HVqJr', 'pāşšŵōřđ', 256); // decr: 'big secret'
 */
/*Aes.Ctr.decrypt = function(ciphertext, password, nBits) {
 var blockSize = 16;  // block size fixed at 16 bytes / 128 bits (Nb=4) for AES
 if (!(nBits==128 || nBits==192 || nBits==256)) return ''; // standard allows 128/192/256 bit keys
 ciphertext = String(ciphertext).base64Decode();
 password = String(password).utf8Encode();

 // use AES to encrypt password (mirroring encrypt routine)
 var nBytes = nBits/8;  // no bytes in key
 var pwBytes = new Array(nBytes);
 for (var i=0; i<nBytes; i++) {
 pwBytes[i] = isNaN(password.charCodeAt(i)) ? 0 : password.charCodeAt(i);
 }
 var key = Aes.cipher(pwBytes, Aes.keyExpansion(pwBytes));
 key = key.concat(key.slice(0, nBytes-16));  // expand key to 16/24/32 bytes long

 // recover nonce from 1st 8 bytes of ciphertext
 var counterBlock = new Array(8);
 var ctrTxt = ciphertext.slice(0, 8);
 for (var i=0; i<8; i++) counterBlock[i] = ctrTxt.charCodeAt(i);

 // generate key schedule
 var keySchedule = Aes.keyExpansion(key);

 // separate ciphertext into blocks (skipping past initial 8 bytes)
 var nBlocks = Math.ceil((ciphertext.length-8) / blockSize);
 var ct = new Array(nBlocks);
 for (var b=0; b<nBlocks; b++) ct[b] = ciphertext.slice(8+b*blockSize, 8+b*blockSize+blockSize);
 ciphertext = ct;  // ciphertext is now array of block-length strings

 // plaintext will get generated block-by-block into array of block-length strings
 var plaintxt = new Array(ciphertext.length);

 for (var b=0; b<nBlocks; b++) {
 // set counter (block #) in last 8 bytes of counter block (leaving nonce in 1st 8 bytes)
 for (var c=0; c<4; c++) counterBlock[15-c] = ((b) >>> c*8) & 0xff;
 for (var c=0; c<4; c++) counterBlock[15-c-4] = (((b+1)/0x100000000-1) >>> c*8) & 0xff;

 var cipherCntr = Aes.cipher(counterBlock, keySchedule);  // encrypt counter block

 var plaintxtByte = new Array(ciphertext[b].length);
 for (var i=0; i<ciphertext[b].length; i++) {
 // -- xor plaintxt with ciphered counter byte-by-byte --
 plaintxtByte[i] = cipherCntr[i] ^ ciphertext[b].charCodeAt(i);
 plaintxtByte[i] = String.fromCharCode(plaintxtByte[i]);
 }
 plaintxt[b] = plaintxtByte.join('');
 }

 // join array of blocks into single plaintext string
 var plaintext = plaintxt.join('');
 plaintext = plaintext.utf8Decode();  // decode from UTF8 back to Unicode multi-byte chars

 return plaintext;
 };
 */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/** Extend String object with method to encode multi-byte string to utf8
 *  - monsur.hossa.in/2012/07/20/utf-8-in-javascript.html */
if (typeof String.prototype.utf8Encode == 'undefined') {
    String.prototype.utf8Encode = function () {
        return unescape(encodeURIComponent(this));
    };
}

/** Extend String object with method to decode utf8 string to multi-byte */
if (typeof String.prototype.utf8Decode == 'undefined') {
    String.prototype.utf8Decode = function () {
        try {
            return decodeURIComponent(escape(this));
        } catch (e) {
            return this; // invalid UTF-8? return as-is
        }
    };
}


/** Extend String object with method to encode base64
 *  - developer.mozilla.org/en-US/docs/Web/API/window.btoa, nodejs.org/api/buffer.html
 *  note: if btoa()/atob() are not available (eg IE9-), try github.com/davidchambers/Base64.js */
if (typeof String.prototype.base64Encode == 'undefined') {
    String.prototype.base64Encode = function () {
        if (typeof btoa != 'undefined') return btoa(this); // browser
        if (typeof Buffer != 'undefined') return new Buffer(this, 'utf8').toString('base64'); // Node.js
        throw new Error('No Base64 Encode');
    };
}

/** Extend String object with method to decode base64 */
if (typeof String.prototype.base64Decode == 'undefined') {
    String.prototype.base64Decode = function () {
        if (typeof atob != 'undefined') return atob(this); // browser
        if (typeof Buffer != 'undefined') return new Buffer(this, 'base64').toString('utf8'); // Node.js
        throw new Error('No Base64 Decode');
    };
}


/* - - - - - - - - - - - - Entry point for web worker  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


self.onmessage = function (objEvent) {
    var password = objEvent.data.pwd;
    var iv = objEvent.data.iv;
    var ptArray = objEvent.data.plainText;

    // first convert array to string
    var contentStr = '';
    for (var i = 0; i < ptArray.length; i++) {
        contentStr += String.fromCharCode(ptArray[i]);
    }

    // now encrypt
    var ciphertext = Aes.Ctr.encrypt(contentStr, password, iv, 256);
}
