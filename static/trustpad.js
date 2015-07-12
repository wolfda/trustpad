/**
 * @file implements the trustpad UI.
 * @author Daniel Wolf
 */

var CLIENT_ID = '170791641914-aihfsicei215ult5r0qjmq5gg0jqn4k6.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';
var trustpad;

/**
 * Check if the current user has authorized the application.
 */
function start() {
    var textArea = document.getElementById('text-area');
    trustpad = new Trustpad(textArea);
    trustpad.checkAuth();
}

var Trustpad = function(textArea) {
    this.textArea = textArea;
    this.gdrive = new GDrive();
}

Trustpad.prototype.setStatus = function(statusMessage) {
    document.getElementById('save-status').innerText = statusMessage;
};

Trustpad.prototype.checkAuth = function() {
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
                fileId = files[0].id;
                this.gdrive.readFile(fileId, function(content) {
                    var params = JSON.parse(content);
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
};

Trustpad.prototype.signin = function() {
    this.showDialog('signin-dialog');
};

Trustpad.prototype.signinGoogle = function() {
    this.hideDialog('signin-dialog');
    this.gdrive.auth(false, this.checkAuth.bind(this));
};

Trustpad.prototype.setContent = function(fileId, content) {
    this.fileId = fileId;
    this.textArea.value = content;
};

Trustpad.prototype.scheduleSave = function(millis) {
    this.setStatus('Saving...');
    if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(function() {
        this.save();
    }.bind(this), millis);
};

Trustpad.prototype.save = function() {
    if (!this.codec) {
        return;
    }
    var content = this.codec.encrypt(this.textArea.value);
    this.gdrive.writeFile(this.fileId, content, function(newFileId) {
        if (!this.fileId) {
            this.fileId = newFileId;
        }
        this.setStatus('All changes saved');
    }.bind(this));
};

Trustpad.prototype.showDialog = function(dialogId, focusId) {
    document.getElementById('glasspanel').style.display = 'block';
    document.getElementById(dialogId).style.display = 'block';
    if (focusId) {
        document.getElementById(focusId).focus();
    }
};

Trustpad.prototype.hideDialog = function(dialogId) {
    document.getElementById('glasspanel').style.display = 'none';
    document.getElementById(dialogId).style.display = 'none';
};

Trustpad.prototype.decrypt = function() {
    var passphrase = document.getElementById('passphrase').value;
    this.codec = new Codec(passphrase);
    var plainText = this.codec.decrypt(this.cipherText);
    if (!plainText) {
        document.getElementById('passphrase-error').innerText = 'Invalid pass phrase';
        document.getElementById('passphrase').value = '';
        document.getElementById('passphrase').focus();
        return;
    }
    this.setContent(this.fileId, this.codec.decrypt(this.cipherText));
    this.hideDialog('passphrase-dialog');
    this.setStatus('All changes saved');
};

Trustpad.prototype.newPassphrase = function() {
    var passphrase = document.getElementById('new-passphrase').value;
    var passphrase2 = document.getElementById('new-passphrase2').value;
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
};
