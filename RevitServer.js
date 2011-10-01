var SERVICE_URL = "http://localhost/RevitServerAdminRESTService/AdminRESTService.svc/";
var RevitServer = {

    //Revit Server API requires certain headers each time
    //we'll store these here so we dont ahve to re-make them.
    getCommonHeaders: function () {
        var headers = {
            'User-Name': 'Html5User',
            'User-Machine-Name': 'localhost',
            'Operation-GUID': Utils.getGuid() //GUID is used to identify each request.
        };
        return headers;
    },

    getServerInfo: function () {

        //ajax call from Jquery
        $.ajax({
            url: SERVICE_URL + "serverProperties",
            headers: RevitServer.getCommonHeaders(),
            success: function (data) {
                var serverNameText = data.CentralServerName;
                if (data.IsCentralServer)
                    serverNameText += ' (Central Server)';

                $('#serverName').html(serverNameText);
            },
            error: function (data) {
                alert('error' + data);
            }
        });

    },

    getFolders: function (currentPath, level) {


        $.ajax({
            url: SERVICE_URL + currentPath + '/contents',
            headers: RevitServer.getCommonHeaders(),
            success: function (data) {

                for (var i = 0; i < data.Folders.length; i++) {
                    var spacer = "";
                    for (var x = 0; x < level; x++) {
                        spacer += "&nbsp;";
                    }

                    $('#Folders1').append("<li><a href='#'>" + spacer + data.Folders[i].Name + "</a><ul></ul></li>");

                    var path = data.Path.replace('\\', '|');
                    if (path == " ")
                        path = "";
                    RevitServer.getFolders(path + '|' + data.Folders[i].Name, level + 1);
                }

            }
        });

    },

    init: function () {

        RevitServer.getServerInfo();
        //start on folder " " which is the shortcut to get the base folders
        RevitServer.getFolders(" ", 1);

        $(function() {


        });
    }
};


var Utils = {
    //taken from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    getGuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};


//entry point
$(document).ready(function () {

    RevitServer.init();

});