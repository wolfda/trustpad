/**
 * @file implements the trustpad UI.
 * @author Daniel Wolf
 */

var trustpad;

/**
 * Check if the current user has authorized the application.
 */
function start() {
    let textArea = document.getElementById('text-area');
    trustpad = new Trustpad(textArea);
    trustpad.checkAuth();
}

class Trustpad {
    textArea;
    gdrive = new GDrive();
    constructor(textArea) {
        this.textArea = textArea;
    }

    setStatus(statusMessage) {
        document.getElementById('save-status').innerText = statusMessage;
    }

    checkAuth() {
        this.gdrive.auth(true, function(authorized) {
            if (!authorized) {
                this.signin();
                return;
            }
            this.gdrive.listTrustpadFiles(function(files) {
                console.log('files: ' + files.length);
                if (files.length == 0) {
                    this.showDialog('new-passphrase-dialog', 'new-passphrase');
                    this.setStatus('New passphrase required');
                } else if (files.length == 1) {
                    let fileId = files[0].id;
                    this.gdrive.readFile(fileId, function(content) {
                        let params = JSON.parse(content);
                        this.cipherText = content;
                        trustpad.setContent(fileId, params.encrypted);
                        this.showDialog('passphrase-dialog', 'passphrase');
                        this.setStatus('Password required');
                    }.bind(this));
                } else {
                    alert('Oops. More than one file not supported yet.');
                }
            }.bind(this));
        }.bind(this));
    }

    signin() {
        this.showDialog('signin-dialog');
    }

    signinGoogle() {
        this.hideDialog('signin-dialog');
        this.gdrive.auth(false, this.checkAuth.bind(this));
    }

    setContent(fileId, content) {
        this.fileId = fileId;
        this.textArea.value = content;
    }

    scheduleSave(millis) {
        this.setStatus('Saving...');
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(function() {
            this.save();
        }.bind(this), millis);
    }

    save() {
        if (!this.codec) {
            return;
        }
        let content = this.codec.encrypt(this.textArea.value);
        this.gdrive.writeFile(this.fileId, content, function(newFileId) {
            if (!this.fileId) {
                this.fileId = newFileId;
            }
            this.setStatus('All changes saved');
        }.bind(this));
    }

    showDialog(dialogId, focusId) {
        document.getElementById('glasspanel').style.display = 'block';
        document.getElementById(dialogId).style.display = 'block';
        if (focusId) {
            document.getElementById(focusId).focus();
        }
    }

    hideDialog(dialogId) {
        document.getElementById('glasspanel').style.display = 'none';
        document.getElementById(dialogId).style.display = 'none';
    }

    decrypt() {
        let passphrase = document.getElementById('passphrase').value;
        this.codec = new Codec(passphrase);
        let plainText = this.codec.decrypt(this.cipherText);
        if (!plainText) {
            document.getElementById('passphrase-error').innerText = 'Invalid pass phrase';
            document.getElementById('passphrase').value = '';
            document.getElementById('passphrase').focus();
            return;
        }
        this.setContent(this.fileId, this.codec.decrypt(this.cipherText));
        this.hideDialog('passphrase-dialog');
        this.setStatus('All changes saved');
    }

    newPassphrase() {
        let passphrase = document.getElementById('new-passphrase').value;
        let passphrase2 = document.getElementById('new-passphrase2').value;
        if (passphrase != passphrase2) {
            document.getElementById('new-passphrase-error').innerText = 'Passphrases do not match';
            document.getElementById('new-passphrase').value = '';
            document.getElementById('new-passphrase2').value = '';
            document.getElementById('new-passphrase').focus();
            return;
        }
        if (!passphrase) {
            document.getElementById('new-passphrase-error').innerText = 'Passphrase empty';
            document.getElementById('new-passphrase').value = '';
            document.getElementById('new-passphrase2').value = '';
            document.getElementById('new-passphrase').focus();
            return;
        }
        this.hideDialog('new-passphrase-dialog');
        this.codec = new Codec(passphrase);
    }
}

