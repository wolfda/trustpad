#!/bin/sh

SJCL_ROOT=../sjcl
FILES="sjcl.js codecString.js codecBase64.js sha256.js hmac.js bitArray.js random.js pbkdf2.js aes.js ccm.js"
SJCL_JS="static/sjcl.js"

rm -f $SJCL_JS
for FILE in $FILES
do
    cat $SJCL_ROOT/core/$FILE >> $SJCL_JS
done
