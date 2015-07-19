#!/bin/sh
# Creates the sjcl.js file to encrypt/decrypt with aes/ccm.
# To run this script you first need to clone the sjcl git repository:
#
# git clone https://github.com/bitwiseshiftleft/sjcl.git
# Set SJCL_ROOT to the location of the created directory
#

SJCL_ROOT=../sjcl
FILES="sjcl.js codecString.js codecBase64.js sha256.js hmac.js bitArray.js random.js pbkdf2.js aes.js ccm.js"
SJCL_JS="public/js/sjcl.js"

rm -f $SJCL_JS
for FILE in $FILES
do
    cat $SJCL_ROOT/core/$FILE >> $SJCL_JS
done
echo file $SJCL_JS created
