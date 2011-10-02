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


                var branchHtml = "<li class='closed' id='serverNode'>";
                branchHtml += "<div class='hitareaexpandable-hitarea lastExpandable-hitarea'></div>";
                branchHtml += "<span class='folder selectable'>" + serverNameText + "</span>";
                branchHtml += "<span style='display:none' class='fullPath'> </span>";
                branchHtml += "<ul></ul></li>";

                var branches = $(branchHtml).appendTo("#rootNode");
                $("#Folders1").treeview(
                        { add: branches }
                 );

                //theres a bug with treeview plugin that makes the +/- box not work
                // here is my hack to get it working
                $("#Folders1").find("div.hitarea").click($("#Folders1").find("span").click);
            },
            error: function (data) {
                alert('error' + data);
            }
        });

    },


    getFolders: function (currentPath, parent) {


        $.ajax({
            url: SERVICE_URL + currentPath + '/contents',
            headers: RevitServer.getCommonHeaders(),
            success: function (data) {

                //add all the subfolders
                for (var i = 0; i < data.Folders.length; i++) {

                    //this line looks funny.. but /.../gi is a global string search, and \\ is how we write a backslash
                    // we are replacing the backslash character with a pipe character | which is how the API deals with subfolders
                    var path = data.Path.replace(/\\/gi, '|');
                    if (path == " ")
                        path = "";
                    //we are storign the path to this folder so we can append to it 
                    var pathid = data.Path.replace(/\\/gi, '').replace(' ', '') + data.Folders[i].Name;

                    //construct the html
                    var branchHtml = "<li class='closed' id='" + pathid + "'>";
                    branchHtml += "<div class='hitarea closed-hitarea expandable-hitarea lastExpandable-hitarea'></div>";
                    branchHtml += "<span class='folder selectable'>" + data.Folders[i].Name + "</span>";
                    branchHtml += "<span style='display:none' class='fullPath'>" + path + '|' + data.Folders[i].Name + "</span>";
                    branchHtml += "<ul></ul></li>";

                    //append the new branch to the others and update treeview
                    var branches = $(branchHtml).appendTo(parent + "> ul");
                    $("#Folders1").treeview(
                        { add: branches }
                     );

                    //theres a bug with treeview plugin that makes the +/- box not work
                    // here is my hack to get it working
                    $("#Folders1").find("div.hitarea").click($("#Folders1").find("span").click);

                    //recursively  call the get folders, but this time call it with the sub folder.
                    RevitServer.getFolders(path + '|' + data.Folders[i].Name, "#" + pathid);
                }

                //add all the models in this folder
                for (var x = 0; x < data.Models.length; x++) {
                    //construct the html
                    var branchHtml = "<li>";
                    branchHtml += '<span class="file selectable">' + data.Models[x].Name + "</span>";
                    branchHtml += "<span style='display:none' class='fullPath'>" + path + '|' + data.Models[x].Name + "</span></li>";
                    var branches = $(branchHtml).appendTo(parent + "> ul");
                    $("#Folders1").treeview(
                        { add: branches }
                     );

                }

                $('.selectable:not(.setup)').click(RevitServer.selectedFolder).addClass('setup');
            }
        });

    },

    selectedFolder: function (event) {
        //highlight the current selection
        $('.currentSelection').removeClass('currentSelection');
        $(this).addClass('currentSelection');

        //clear details pane
        $('#rightContent').html(' ');

        //show details for current selection
        //check for folder
        if ($(this).hasClass('folder')) {

            //find its path
            var path = $(this).siblings('.fullPath').html();

            var fileName = $(this).html();
            $.ajax({
                url: SERVICE_URL + path + '/DirectoryInfo',
                headers: RevitServer.getCommonHeaders(),
                success: function (data) {

                    var updatedDateString = data.DateModified.replace('/Date(', '').replace(')/', '');
                    var updatedDate = new Date();
                    updatedDate.setTime(updatedDateString);

                    var createdDateString = data.DateCreated.replace('/Date(', '').replace(')/', '');
                    var createdDate = new Date();
                    createdDate.setTime(createdDateString);

                    //construct html tto display on right
                    var html = "<h1>" + fileName + "</h1>";
                    html += "Last updated: " + updatedDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Date Created: " + createdDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Number of models: " + data.ModelCount + "<br />";
                    html += "Number of folders: " + data.FolderCount + "<br />";
                    html += "Size: " + (data.Size / 1024).toFixed(2) + "KB <br />";

                    $('#rightContent').html(html);
                }
            });
        }

        //check if its a file
        if ($(this).hasClass('file')) {
            //find its path
            var path = $(this).siblings('.fullPath').html();
            var fileName = $(this).html();

            //this isn't clear via the API, but you can get the info for a file the same way you do a directory
            $.ajax({
                url: SERVICE_URL + path + '/DirectoryInfo',
                headers: RevitServer.getCommonHeaders(),
                success: function (data) {

                    var updatedDateString = data.DateModified.replace('/Date(', '').replace(')/', '');
                    var updatedDate = new Date();
                    updatedDate.setTime(updatedDateString);

                    var createdDateString = data.DateCreated.replace('/Date(', '').replace(')/', '');
                    var createdDate = new Date();
                    createdDate.setTime(createdDateString);

                    //construct html tto display on right
                    var html = "<h1>" + fileName + "</h1>";
                    html += "Last updated: " + updatedDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Date Created: " + createdDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Size: " + (data.Size / 1024).toFixed(2) + "KB <br />";

                    $('#rightContent').html(html);
                }
            });


            // also get the history

            $.ajax({
                url: SERVICE_URL + path + '/history',
                headers: RevitServer.getCommonHeaders(),


                success: function (data) {

                    var table = "<br /><h1>Submission history</h1><table id='historyTable'>";
                    //headings
                    table += "<thead><tr>";
                    table += "<th>Version</th>";
                    table += "<th>User</th>";
                    table += "<th>Date</th>";
                    table += "<th>Comment</th>";
                    table += "<th>Model Size</th>";
                    table += "<th>Support Files</th>";

                    table += "</tr></thead><tbody>";
                    for (var currentItem = 0; currentItem < data.Items.length; currentItem++) {

                        var item = data.Items[currentItem];

                        var dateString = item.Date.replace('/Date(', '').replace(')/', '');
                        var date = new Date();
                        date.setTime(dateString);

                        table += "<tr>";

                        //construct html tto display on right
                        table += "<td>" + item.VersionNumber + "</td>";
                        table += "<td>" + item.User + "</td>";
                        table += "<td>" + date.toString("d-MMM-yyyy HH:mm") + "</td>";
                        table += "<td>" + item.Comment + "</td>";
                        table += "<td>" + (item.ModelSize / 1024).toFixed(2) + "KB</td>";
                        table += "<td>" + (item.SupportSize / 1024).toFixed(2) + "KB</td>";
                        table += "</tr>";

                    }

                    table += "</tbody></table>";
                    $('#rightContent').append(table);
                }
            });

        }

    },

    Operations: {

        createNew: function () {
            var fileName = Utils.getSelectedPath();
            if (!fileName)
                return;
            
        },
        remove: function () {

        },
        cut: function () {

        },
        copy: function () {

        },
        paste: function () {

        },
        toggleLock: function () {

        }
    },

    init: function () {

        //setup treeview
        $("#Folders1").treeview();
        
        RevitServer.getServerInfo();

        
        //start on folder " " which is the shortcut to get the base folders
        RevitServer.getFolders(" ", "#serverNode");

    }
};


var Utils = {
    //taken from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    getGuid: function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    getSelectedPath: function () {
        var selected = $('.currentSelection');
        //find its path
        var path = $(selected).siblings('.fullPath').html();
        var fileName = $(selected).html();

        if (!fileName)
            alert('Please select a file or folder first');

        return fileName;
    }
};


//entry point
$(document).ready(function () {

    RevitServer.init();

});