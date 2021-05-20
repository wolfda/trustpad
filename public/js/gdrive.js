/**
 * @file API to read/write text files on Google Drive. See https://developers.google.com/drive/web/quickstart/js
 * @author Daniel Wolf
 */

const API_KEY = 'AIzaSyDXtrqJnhQDUH-WcUfMoIt82c2rzg0NA_Y';
const CLIENT_ID = '959445099578-f0d77i0ss10l9jdi89em1cdsurhvhkv6.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

class GDrive {
    load() {
        return new Promise((successCallback, errorCallback) => gapi.load('client:auth2', successCallback))
            .then(res => gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES
                }));
    }

    isSignedIn() {
        return gapi.auth2.getAuthInstance().isSignedIn.get();
    }

    signIn(interactive) {
        let options = {};
        if (!interactive) {
            options.prompt = 'none';
        }
        return gapi.auth2.getAuthInstance().signIn(options);
    }

    signOut() {
        return gapi.auth2.getAuthInstance().signOut();
    }

    listTrustpadFiles() {
        return new Promise((successCallback, errorCallback) => {
            let request = gapi.client.drive.files.list({
                q: 'name contains \'.trustpad\' and not trashed',
                spaces: 'drive',
                fields: 'files(id, name, modifiedTime, webViewLink)'
            }).then(
                function(res) {
                    successCallback(res.result.files);
                },
                function(error) {
                    errorCallback(error);
                }
            );
        });
    }

    writeFile(fileId, filename, data, callback) {
        return new Promise((successCallback, errorCallback) => {
            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const closeDelim = "\r\n--" + boundary + "--";
            let metadata = {
                'mimeType': 'text/plain'
            };
            if (filename) {
                metadata.title = filename + '.trustpad';
            }
            let body = delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: text/plain\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                btoa(data) +
                closeDelim;
            let url = '/upload/drive/v2/files';
            if (fileId) {
                url += '/' + fileId;
            }
            let request = gapi.client.request({
                'path': url,
                'method': fileId ? 'PUT' : 'POST',
                'params': { 'uploadType': 'multipart' },
                'headers': { 'Content-Type': 'multipart/mixed; boundary="' + boundary + '"' },
                'body': body
            }).then(
                function(res) {
                    successCallback(res.result.id);
                },
                function(error) {
                    errorCallback(error);
                }
            );
        });
    }

    readFile(fileId) {
        return new Promise((successCallback, errorCallback) => {
            let request = gapi.client.drive.files.get({
                'fileId': fileId,
                'alt': 'media'
            }).then(
                function(res) {
                    successCallback(res.body);
                },
                function(error) {
                    errorCallback(error);
                }
            );
        });
    }
}


