// Your Client ID can be retrieved from your project in the Google
      // Developer Console, https://console.developers.google.com
      var CLIENT_ID = '698825936465-j1cs44897v5flnfrf7fpppnukp6okpq7.apps.googleusercontent.com';

      var SCOPES = ['https://www.googleapis.com/auth/drive.appfolder'];

      /**
       * Check if current user has authorized this application.
       */
      function checkAuth() {
        gapi.auth.authorize(
          {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
          }, handleAuthResult);
      }

      /**
       * Handle response from authorization server.
       *
       * @param {Object} authResult Authorization result.
       */
      function handleAuthResult(authResult) {
        var authorizeDiv = document.getElementById('authorize-div');
        if (authResult && !authResult.error) {
          // Hide auth UI, then load client library.
          authorizeDiv.style.display = 'none';
          loadDriveApi();
        } else {
          // Show auth UI, allowing the user to initiate authorization by
          // clicking authorize button.
          authorizeDiv.style.display = 'inline';
        }
      }

      /**
       * Initiate auth flow in response to user clicking authorize button.
       *
       * @param {Event} event Button click event.
       */
      function handleAuthClick(event) {
        gapi.auth.authorize(
          {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
          handleAuthResult);
        return false;
      }

      /**
       * Load Drive API client library.
       */
      function loadDriveApi() {
        gapi.client.load('drive', 'v3', listFiles);
      }

      /**
       * Print files.
       */
      function listFiles() {
        var request = gapi.client.drive.files.list({
            'pageSize': 10,
            'fields': "nextPageToken, files(id, name)"
          });

          request.execute(function(resp) {
            appendPre('Files:');
            var files = resp.files;
            if (files && files.length > 0) {
              for (var i = 0; i < files.length; i++) {
                var file = files[i];
                appendPre(file.name + ' (' + file.id + ')');
              }
            } else {
              appendPre('No files found.');
            }
          });
      }

      /**
       * Append a pre element to the body containing the given message
       * as its text node.
       *
       * @param {string} message Text to be placed in pre element.
       */
      function appendPre(message) {
        var pre = document.getElementById('output');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);
      }



var createFileWithJSONContent = function(name, data, callback) {
    console.log("start createFileWithJSONContent");
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'application/json';

  var metadata = {
      'name': name,
      'mimeType': contentType,
      'id': data.DriveId
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});
    if (!callback) {
      callback = function(file) {
        console.log("aaa: ",file)
      };
    }
    request.execute(callback);
    request.oncomplete = function(){alert("a")};
    request.onsuccess = function(){alert("b")};
    console.log("end createFileWithJSONContent");
}