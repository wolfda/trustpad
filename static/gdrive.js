/**
 * @file API to read/write text files on Google Drive.
 * @author Daniel Wolf
 */

function GDrive() {
}

GDrive.CLIENT_ID = '170791641914-aihfsicei215ult5r0qjmq5gg0jqn4k6.apps.googleusercontent.com';
GDrive.SCOPES = 'https://www.googleapis.com/auth/drive';

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
    var request = gapi.client.request({
        'path': 'https://www.googleapis.com/drive/v2/files/root/children',
        'method': 'GET',
        'params': {
            'q': 'title contains \'.trustpad\' and trashed=false'
        }
    }).then(
        function(res) {
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
    var request = gapi.client.request({
        'path': '/drive/v2/files/' + fileId,
        'params': { 'alt': 'media' }
    }).then(
        function(res) {
            callback(res.body);
        },
        function(error) {
            console.log('error: ' + error);
        }
    );
};

GDrive.prototype.getFile = function(id, callback) {
    var request = gapi.client.request({
        'path': 'https://www.googleapis.com/drive/v2/files/' + id,
        'method': 'GET'
    }).then(
        callback,
        function(error) {
            console.log('error: ' + error);
        }
    );
};
