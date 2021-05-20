/**
 * @file implements the trustpad UI.
 * @author Daniel Wolf
 */

var trustpad;

function log(message) {
    let splash = document.getElementById("splash");
    splash.innerHTML += message + "<br>";
}

/**
 * Check if the current user has authorized the application.
 */
function start() {
    let gdrive = new GDrive();
    gdrive.load()
        .then(res => {
            let textArea = document.getElementById("text-area");
            let textAreaRo = document.getElementById("text-area-ro");
            trustpad = new Trustpad(textArea, textAreaRo, gdrive);
            trustpad.checkAuth().then(res => {
                trustpad.loadFromAddressBar();
            });
        })
        .catch(error => {
            log("Error, unable to start the application");
            throw error;
        });
}

class Trustpad {
    textArea;
    textAreaRo;
    saving;
    gdrive;
    fileId;
    modalDialog = new ModalDialog();
    saveTimeout;

    constructor(textArea, textAreaRo, gdrive) {
        this.textArea = textArea;
        this.textAreaRo = textAreaRo;
        this.gdrive = gdrive;
        this.saving = false;

        window.addEventListener('popstate', function() {
            trustpad.loadFromAddressBar();
        });
        document.getElementById('file-editor-close')
            .addEventListener('click', function() {
                this.updateAddressBar("/")
            }.bind(this));
    }

    setVisible_(element, visible) {
        element.style.display = visible ? 'block' : 'none';
    }

    hideLoading() {
        this.setVisible_(document.getElementById('splash'), false);
    }

    checkAuth() {
        if (!this.gdrive.isSignedIn()) {
            return this.gdrive.signIn(true).then(res => this.checkAuth());
        }
        return Promise.resolve();
    }

    signin() {
        this.modalDialog.openDialog('signin-dialog')
            .then(values => this.gdrive.signIn(true))
            .then(res => this.checkAuth())
    }

    setContent(fileId, content) {
        this.fileId = fileId;
        this.textArea.value = content;
        this.textAreaRo.innerText = content;
    }

    scheduleSave(millis) {
        document.getElementById('file-editor-view').classList.add("disabled");
        this.saving = true;
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
        this.gdrive.writeFile(this.fileId, null, content).then(newFileId => {
            this.fileId = newFileId;
            document.getElementById('file-editor-view').classList.remove("disabled");
            this.saving = false;
        });
    }

    openCreateFile() {
        let validate = function(values) {
            if (!values.filename) {
                document.getElementById('new-passphrase-error').innerText = 'Name empty';
                return false;
            }
            if (!values.password) {
                document.getElementById('new-passphrase-error').innerText = 'Password empty';
                document.getElementById('new-passphrase').value = '';
                document.getElementById('new-passphrase2').value = '';
                document.getElementById('new-passphrase').focus();
                return false;
            }
            if (values.password.length < 6) {
                document.getElementById('new-passphrase-error').innerText = 'Password too short';
                document.getElementById('new-passphrase').value = '';
                document.getElementById('new-passphrase2').value = '';
                document.getElementById('new-passphrase').focus();
                return false;
            }
            if (values.password != values.password2) {
                document.getElementById('new-passphrase-error').innerText = 'Passwords do not match';
                document.getElementById('new-passphrase').value = '';
                document.getElementById('new-passphrase2').value = '';
                document.getElementById('new-passphrase').focus();
                return false;
            }
            return true;
        }
        this.modalDialog.openDialog('new-file-dialog', 'new-filename', validate).then(values => {
            this.codec = new Codec(values.password);
            this.gdrive.writeFile(null, values.filename, this.codec.encrypt(''))
                .then(newFileId => this.updateAddressBar("/" + newFileId));
        });
    }

    sortFileByName_(file0, file1) {
        if (file0.name < file1.name) {
            return -1;
        } else if (file0.name > file1.name) {
            return 1;
        } else {
            return 0;
        }
    }

    showFileList() {
        return this.gdrive.listTrustpadFiles().then(files => {
            files.sort(this.sortFileByName_);
            let filelistDiv = document.getElementById('filelist');
            this.setVisible_(filelistDiv, true);
            let table = filelistDiv.children[0];
            table.innerHTML = "";

            table.appendChild(this.newFileListRowHeader_());
            files.forEach(file => table.appendChild(this.newFileListRow_(file)));
            this.setVisible_(document.getElementById('create-trailer'), files.length === 0);
        });
    }

    hideFileList() {
        this.setVisible_(document.getElementById('filelist'), false);
    }

    newFileListRowHeader_() {
        let header = document.createElement('tr');
        header.innerHTML = "<th>Name</th>";
        return header;
    }

    newFileListRow_(file) {
        let tr = document.createElement("tr");
        tr.className = "file";
        let cell = document.createElement("td");

        let name = document.createElement("div");
        name.className = "name";
        name.innerText = file.name;
        let lastModified = document.createElement("div");
        lastModified.className = "lastModified";
        lastModified.innerText = "Modified " + new Date(file.modifiedTime).toLocaleDateString();
        cell.appendChild(name);
        cell.appendChild(lastModified);
        tr.appendChild(cell);
        tr.onclick = function() {
            this.updateAddressBar("/" + file.id);
        }.bind(this);
        return tr;
    }

    openFile(fileId) {
        this.view();
        return this.gdrive.readFile(fileId).then(content => {
            this.fileId = fileId;
            this.setVisible_(document.getElementById('file-editor'), true);
            let params = JSON.parse(content);
            this.cipherText = content;
            this.setContent(fileId, params.encrypted);
            document.getElementById('passphrase').value = '';
            let validate = function(values) {
                if (new Codec(values.password).decrypt(this.cipherText) === null) {
                    document.getElementById('passphrase-error').innerText = 'Invalid pass phrase';
                    document.getElementById('passphrase').value = '';
                    document.getElementById('passphrase').focus();
                    return false;
                }
                return true;
            }.bind(this);
            this.modalDialog.openDialog('passphrase-dialog', 'passphrase', validate).then(values => {
                this.codec = new Codec(values.password);
                let plainText = this.codec.decrypt(this.cipherText);
                this.setContent(this.fileId, this.codec.decrypt(this.cipherText));
            });
        });
    }

    view() {
        if (!this.saving) {
            this.textAreaRo.innerText = this.textArea.value;
            this.setVisible_(this.textAreaRo, true);
            this.setVisible_(this.textArea, false);
            this.setVisible_(document.getElementById("file-editor-edit"), true);
            this.setVisible_(document.getElementById("file-editor-view"), false);
        }
    }

    edit() {
        this.setVisible_(this.textAreaRo, false);
        this.setVisible_(this.textArea, true);
        this.setVisible_(document.getElementById("file-editor-edit"), false);
        this.setVisible_(document.getElementById("file-editor-view"), true);
    }

    closeFile() {
        this.setVisible_(document.getElementById('file-editor'), false);
    }

    updateAddressBar(url) {
        window.history.pushState(null, null, url);
        this.loadFromAddressBar();
    }

    loadFromAddressBar() {
        let fileId = window.location.pathname.substr(1);
        if (fileId) {
            this.hideFileList();
            this.openFile(fileId)
                .then(res => this.hideLoading());
        } else {
            this.modalDialog.close();
            this.closeFile();
            this.showFileList()
                .then(res => this.hideLoading());
        }
    }
}

class ModalDialog {
    openedDialogId;

    /**
     * Opens a new modal dialog.
     * @param dialogId The ID of the dialog div.
     * @param focusId the ID of the element to start in focus.
     * @param validate a data validation function.
     */
    openDialog(dialogId, focusId, validate) {
        let dialogElement = document.getElementById(dialogId);
        this.clearInputs_(dialogElement);
        this.close();
        document.getElementById('glasspanel').style.display = 'block';
        dialogElement.style.display = 'block';
        if (focusId) {
            document.getElementById(focusId).focus();
        }
        this.openedDialogId = dialogId;

        return new Promise((success, error) => {
            let onSubmitCallback = (() => this.onSubmit_(dialogElement, validate, success));
            this.registerOnSubmitCallbackonSubmit_(dialogElement, onSubmitCallback);
        });
    }

    /**
     * The handler called on form submit.
     */
    onSubmit_(dialogElement, validate, successCallback) {
        let values = {};
        this.getValues_(dialogElement, values);
        if (!validate || validate(values)) {
            this.clearInputs_(dialogElement);
            this.close();
            successCallback(values);
        }
        return false;
    }

    /**
     * Registers a new onsubmit callback.
     */
    registerOnSubmitCallbackonSubmit_(element, callback) {
        if (element.nodeName === 'FORM') {
            element.onsubmit = callback;
            return;
        }
        for (let child of element.children) {
            this.registerOnSubmitCallbackonSubmit_(child, callback);
        }
    }

    /**
     * Clears all the <input> fields.
     */
    clearInputs_(element) {
        if (element.nodeName === 'INPUT' && element.name) {
            element.value = '';
        }
        if (element.className === 'error') {
            element.innerText = '';
        }
        for (let child of element.children) {
            this.clearInputs_(child);
        }
    }

    /**
     * Retrives all the values of the dialog
     */
    getValues_(element, values) {
        if (element.nodeName === 'INPUT' && element.name) {
            values[element.name] = element.value;
        }
        for (let child of element.children) {
            this.getValues_(child, values);
        }
    }

    /**
     * Closes any open dialog.
     */
    close() {
        if (this.openedDialogId) {
            document.getElementById('glasspanel').style.display = 'none';
            document.getElementById(this.openedDialogId).style.display = 'none';
            this.openedDialogId = null;
        }
    }
}
