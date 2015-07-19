/**
 * @file API to read/write text files on Google Drive. See https://developers.google.com/drive/web/quickstart/js
 * @author Daniel Wolf
 */

function GDrive() {
    this.ready = false;
    this.delayedQueue = [];

    gapi.client.setApiKey(GDrive.API_KEY);
    gapi.client.load('drive', 'v2', this.setReady.bind(this));
}

GDrive.API_KEY = 'AIzaSyCIfNCqRxgnd5xanK9oCtv8olMOF9187yQ';
GDrive.CLIENT_ID = '170791641914-aihfsicei215ult5r0qjmq5gg0jqn4k6.apps.googleusercontent.com';
GDrive.SCOPES = 'https://www.googleapis.com/auth/drive';

/**
 * Delay the execution of an api method after the api is ready.
 */
GDrive.prototype.whenReadyCall = function(delayedFunction) {
    this.delayedQueue.push(delayedFunction);
};

/**
 * Notify that the drive api is ready to be called. Processes any pending calls than may have been queued up.
 */
GDrive.prototype.setReady = function() {
    this.ready = true;
    for (var i = 0; i < this.delayedQueue.length; i++) {
        this.delayedQueue[i]();
    }
    this.delayedQueue = null;
};

/**
 * Check if the current user has authorized the application.
 */
GDrive.prototype.auth = function(immediate, callback) {
    gapi.auth.authorize({
        'client_id': GDrive.CLIENT_ID,
        'scope': GDrive.SCOPES,
        'immediate': immediate
    }, function(authResult) {
        callback(authResult && !authResult.error);
    });
};

GDrive.prototype.listTrustpadFiles = function(callback) {
    if (!this.ready) {
        this.whenReadyCall(this.listTrustpadFiles.bind(this, callback));
        return;
    }

    var request = gapi.client.drive.files.list({
        'q': 'title contains \'.trustpad\' and not trashed'
    }).then(
        function(res) {
          console.log(res.result);
          callback(res.result.items);
        },
        function(error) {
          console.log('error: ' + error);
        }
    );
};

GDrive.prototype.writeFile = function(fileId, data, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";
    var metadata = {
        'title': 'test.trustpad',
        'mimeType': 'text/plain'
    };
    var body = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        btoa(data) +
        closeDelim;
    var url = '/upload/drive/v2/files';
    if (fileId) {
        url += '/' + fileId;
    }
    var request = gapi.client.request({
        'path': url,
        'method': fileId ? 'PUT' : 'POST',
        'params': { 'uploadType': 'multipart' },
        'headers': { 'Content-Type': 'multipart/mixed; boundary="' + boundary + '"' },
        'body': body
    }).then(
        function(res) {
            callback(res.id);
        },
        function(error) {
            console.log('error: ' + error);
        }
    );
};

GDrive.prototype.readFile = function(fileId, callback) {
    if (!this.ready) {
        this.whenReadyCall(this.readFile.bind(this, fileId, callback));
        return;
    }

    var request = gapi.client.drive.files.get({
        'fileId': fileId,
        'alt': 'media'
    }).then(
        function(res) {
            callback(res.body);
        },
        function(error) {
            console.log('error: ' + error);
        }
    );
};
