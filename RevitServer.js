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


    getFolders: function (currentPath, level, parent) {


        $.ajax({
            url: SERVICE_URL + currentPath + '/contents',
            headers: RevitServer.getCommonHeaders(),
            success: function (data) {

                for (var i = 0; i < data.Folders.length; i++) {

                    //this line looks funny.. but /.../gi is a global string search, and \\ is how we write a backslash
                    // we are replacing the backslash character with a pipe character | which is how the API deals with subfolders
                    var path = data.Path.replace(/\\/gi, '|');
                    if (path == " ")
                        path = "";

                    var pathid = data.Path.replace(/\\/gi, '').replace(' ', '') + data.Folders[i].Name;

                    var branchHtml = "<li class='closed' id='" + pathid + "'>";
                    branchHtml += "<div class='hitarea closed-hitarea expandable-hitarea lastExpandable-hitarea'></div>";
                    branchHtml += "<span class='folder'>" + data.Folders[i].Name + "</span><ul></ul></li>";



                    var branches = $(branchHtml).appendTo(parent + "> ul");
                    $("#Folders1").treeview({
                        add: branches
                    }
                   );
                    $("#Folders1").find("div.hitarea").click($("#Folders1").find("span").click);


                    //  $(parent + "> ul").append(branchHtml);
                    // $("#Folders1").treeview();
                    RevitServer.getFolders(path + '|' + data.Folders[i].Name, level + 1, "#" + pathid);
                }


            }
        });

    },

    init: function () {

        RevitServer.getServerInfo();
        //start on folder " " which is the shortcut to get the base folders
        $("#Folders1").treeview();
        RevitServer.getFolders(" ", 1, "#Folders1");


        //        setTimeout(function () {
        //            // $("#Folders1").treeview();


        //        }, 1000);

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