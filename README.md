# Trustpad

Trustpad saves private information on the cloud. Any data saved on the cloud is encrypted with AES with a 256-bit key.
The AES secret key is only known from the document owner. Therefore the cloud operator (Google, Dropbox, ...) storing
the data is unable to decrypt the private content.

We believe in security by transparency. Trustpad is made open-source so anybody can inspect the encryption code and
verify that there is no malicious code.

This first version of Trustpad provides a javascript client which stores private content on Google Drive. You can try it out at [http://trust-pad.appspot.com](http://trust-pad.appspot.com)

Users have several way to inspect that their data is securely encrypted:
- look at *.trustpad files on the cloud provider (Google Drive, Dropbox, ...) to verify that the content is well
encrypted.
- inspect the client code of trustpad on github.
- debug step-by-step the javascript client code inside a browser.

# Run local server

```
./script/dev-appengine.sh
```

This will run a local http server on port 8080.

# Deploy

```
./script/deploy-appengine.sh
appcfg.py update .
```

This will deploy the master branch on appengine.
