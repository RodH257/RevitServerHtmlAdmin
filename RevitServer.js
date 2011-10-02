var SERVICE_URL = "http://localhost/RevitServerAdminRESTService/AdminRESTService.svc/";
var RevitServer = {

    //Revit Server API requires certain headers each time
    //we'll store these here so we dont ahve to re-make them.
    getCommonHeaders: function () {
        var headers = {
            'User-Name': 'HtmlUser',
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
                branchHtml += "<span class='folder selectable' style='background: url(images/ServerIcon.PNG) 0 0 no-repeat;'>"
                    + serverNameText + "</span>";
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

        // first, get the lock status of the descendants
        $.ajax({
            url: SERVICE_URL + currentPath + '/descendent/locks',
            headers: RevitServer.getCommonHeaders(),
            success: function (lockData) {

                //now get the actual folder info
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

                            var lockedClass = '';
                            //check if its locked or not 
                            if (lockData.Items) {
                                var folderPathToCheck = data.Path + '\\' + data.Folders[i].Name;
                                if ($.inArray(folderPathToCheck, lockData.Items) >= 0) {
                                    //yes, there is a lock on it
                                    lockedClass = 'locked';

                                }
                            }


                            //construct the html
                            var branchHtml = "<li class='closed' id='" + pathid + "'>";
                            branchHtml += "<div class='hitarea closed-hitarea expandable-hitarea lastExpandable-hitarea'></div>";
                            branchHtml += "<span class='folder selectable " + lockedClass + "'>" + data.Folders[i].Name + "</span>";
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

                            var lockedClass = '';
                            //check if its locked or not 
                            if (lockData.Items) {
                                var folderPathToCheck = data.Path + '\\' + data.Models[x].Name;
                                if ($.inArray(folderPathToCheck, lockData.Items) >= 0) {
                                    //yes, there is a lock on it
                                    lockedClass = 'locked';
                                }
                            }

                            //construct the html
                            var branchHtml = "<li>";
                            branchHtml += '<span class="file selectable ' + lockedClass + '">' + data.Models[x].Name + "</span>";
                            branchHtml += "<span style='display:none' class='fullPath'>" + path + '|' + data.Models[x].Name + "</span></li>";
                            var branches = $(branchHtml).appendTo(parent + "> ul");
                            $("#Folders1").treeview(
                                { add: branches }
                             );

                        }

                        $('.selectable:not(.setup)').click(RevitServer.selectedFolder).addClass('setup');
                    }
                });

            }
        });



    },

    selectedFolder: function (event) {
        //highlight the current selection
        $('.currentSelection').removeClass('currentSelection');
        $(this).addClass('currentSelection');

        //clear details pane
        $('#details').html(' ');
        $('#modelhistory').html(' ');
        $('#picture').html(' ');

        //setup lock icon
        if ($(this).hasClass('locked')) {
            $('#LockButton').attr("src", "Images/6UnlockLock.png");
        } else {
            $('#LockButton').attr("src", "Images/6Lock.png");
        }


        //show details for current selection
        //check for folder
        if ($(this).hasClass('folder')) {

            //find its path
            var path = $(this).siblings('.fullPath').html();
            var fileName = $(this).html();

            //get the full info on the directory
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

                    //construct html to display on right
                    var html = "<h1>" + fileName + "</h1>";
                    html += "Last updated: " + updatedDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Date Created: " + createdDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Number of models: " + data.ModelCount + "<br />";
                    html += "Number of folders: " + data.FolderCount + "<br />";
                    html += "Size: " + (data.Size / 1024).toFixed(2) + "KB <br />";

                    $('#details').html(html);
                }
            });
        }

        //check if its a file
        if ($(this).hasClass('file')) {
            //find its path
            var path = $(this).siblings('.fullPath').html();
            var fileName = $(this).html();

            //unfortunately getting the thumbnail doesn't work at present
            //            //get the thumbnail
            //            $.ajax({
            //                url: SERVICE_URL + path + '/thumbnail?width=64&height=64',
            //                headers: RevitServer.getCommonHeaders(),
            //                success: function (data) {
            //                    var encodedData = Base64.encode(data);
            //                    // $('#picture').html('<img src="data:image/png;base64,' + encodedData + '" >');
            //                    //doesn't seem to work for some reason.
            //                }
            //            });

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

                    //construct html to display on right
                    var html = "<h1>" + fileName + "</h1>";
                    html += "Last updated: " + updatedDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Date Created: " + createdDate.toString("d-MMM-yyyy HH:mm") + "<br />";
                    html += "Size: " + (data.Size / 1024).toFixed(2) + "KB <br />";

                    $('#details').html(html);
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
                    $('#modelhistory').html(table);
                }
            });

        }

    },

    Operations: {

        createNew: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;

            var fileName = window.prompt("Enter a name for the folder", "");

            $.ajax({
                url: SERVICE_URL + currentPath + '|' + fileName,
                type: 'PUT',
                headers: RevitServer.getCommonHeaders(),
                success: function (data) {
                    alert('created');

                }
            });
        },
        remove: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;
            if (confirm("Are you sure you want to delete this?")) {
                $.ajax({
                    url: SERVICE_URL + currentPath + '?newObjectName=',
                    type: 'DELETE',
                    headers: RevitServer.getCommonHeaders(),
                    success: function (data) {
                        alert(currentPath + ' was deleted');
                        $('.currentSelection').parent().remove();
                    }
                });
            }
        },
        cut: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;

            RevitServer.Operations.ClipBoard = currentPath;
            RevitServer.Operations.ClipBoardItem = $('.currentSelection').parent();
            RevitServer.Operations.ClipBoardIsCut = true;
        },
        copy: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;

            RevitServer.Operations.ClipBoard = currentPath;
            RevitServer.Operations.ClipBoardItem = $('.currentSelection').parent();
            RevitServer.Operations.ClipBoardIsCut = false;
            $('#PasteButton').attr("src", "Images/5PasteReady.png");

        },
        paste: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;

            if (!RevitServer.Operations.ClipBoard) {
                alert("You must cut/copy first");
                return;
            }

            var pasteAction = 'Copy';
            if (RevitServer.Operations.ClipBoardIsCut) {
                pasteAction = 'Move';
            }
            if (RevitServer.Operations.ClipBoardIsCut) {
                if (confirm("Are you sure you want to move " + RevitServer.Operations.ClipBoard + " into " + currentPath)) {
                    $.ajax({
                        url: SERVICE_URL + currentPath + '/descendent?sourceObjectPath=' + RevitServer.Operations.ClipBoard
                        + '&pasteAction=' + pasteAction + '&duplicateOption=CopyIncrement'
                        ,
                        type: 'post',
                        headers: RevitServer.getCommonHeaders(),
                        success: function (data) {

                            //recreate the tree, this could be done dynamically but for now, we're just wiping it.
                            $("#leftContent").html(RevitServer.LeftContent);
                            RevitServer.initTree();
                        }
                    });
                }

            }
            else {
                alert("pasting " + RevitServer.Operations.ClipBoard + " into " + currentPath);
                $.ajax({
                    url: SERVICE_URL + currentPath + '/descendent?sourceObjectPath=' + RevitServer.Operations.ClipBoard
                        + '&pasteAction=' + pasteAction + '&duplicateOption=CopyIncrement'
                        ,
                    type: 'post',
                    headers: RevitServer.getCommonHeaders(),
                    success: function (data) {
                        //recreate the tree, this could be done dynamically but for now, we're just wiping it.
                        $("#leftContent").html(RevitServer.LeftContent);
                        RevitServer.initTree();
                    }
                });

            }

            RevitServer.Operations.ClipBoard = null;
            RevitServer.Operations.ClipBoardItem = null;
            RevitServer.Operations.ClipBoardIsCut = false;
            $('#PasteButton').attr("src", "Images/5Paste.png");
        },

        toggleLock: function () {
            var currentPath = Utils.getSelectedPath();
            if (!currentPath)
                return;

            var selected = $('.currentSelection');
            
            //check if its currently locked
            if ($(selected).hasClass('locked')) {
                //it is, unlock it 
                if (confirm("Are you sure you want to unlock this?")) {
                    $.ajax({
                        url: SERVICE_URL + currentPath + '/lock?objectMustExist=false',
                        type: 'DELETE',
                        headers: RevitServer.getCommonHeaders(),
                        success: function (data) {
                            $('.currentSelection').removeClass('locked');
                            //change the icon
                            $('#LockButton').attr("src", "Images/6Lock.png");
                        }
                    });
                }
            } else {
                //it isnt, lock it

                if (confirm("Are you sure you want to lock this?")) {
                    $.ajax({
                        url: SERVICE_URL + currentPath + '/lock',
                        type: 'PUT',
                        headers: RevitServer.getCommonHeaders(),
                        success: function (data) {
                            $('.currentSelection').addClass('locked');
                            //change the icon
                            $('#LockButton').attr("src", "Images/6UnlockLock.png");
                        }
                    });
                }
            }
            
        }


    },

    initTree: function () {
        //save the left content before the treeview so we can rest 
        RevitServer.LeftContent = $("#leftContent").html();

        //setup treeview
        $("#Folders1").treeview();
        RevitServer.getServerInfo();

        //start on folder " " which is the shortcut to get the base folders
        RevitServer.getFolders(" ", "#serverNode");
    },
    init: function () {
        RevitServer.initTree();

        //add handlers to the buttons
        $('#CreateNewButton').click(RevitServer.Operations.createNew);
        $('#DeleteButton').click(RevitServer.Operations.remove);
        $('#CutButton').click(RevitServer.Operations.cut);
        $('#CopyButton').click(RevitServer.Operations.copy);
        $('#PasteButton').click(RevitServer.Operations.paste);
        $('#LockButton').click(RevitServer.Operations.toggleLock);

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

        if (!fileName) {

            alert('Please select a file/folder first');
            return null;
        }

        return path;
        if ($(selected).hasClass('folder'))
            return path;
        else
            return path + '|' + fileName;
    }
};


//entry point
$(document).ready(function () {

    RevitServer.init();

});