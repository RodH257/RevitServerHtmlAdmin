<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Revit Sever HTML Admin</title>
    <link href="jquery.treeview.css" rel="stylesheet" type="text/css" />
    <script src="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.4.min.js"></script>
    <script src="jquery.treeview.js" type="text/javascript"></script>

    <!-- used for base64 encoding the images from web service -->
    <script src="plugins/Base64.js" type="text/javascript"></script>

    <script src="RevitServer.js" type="text/javascript"></script>
    <link href="StyleSheet.css" rel="stylesheet" type="text/css" />
    <script src="plugins/date.js" type="text/javascript"></script>
</head>
<body>
    <div id="top">
        <img src="Images/RevitServerPic.PNG" />
    </div>
    <div id="left">
        <div id="leftHeading">
            <img src="Images/1CreateNew.png" id="CreateNewButton" alt="New" name="New" />
            <img src="Images/2Delete.png" id="DeleteButton" alt="Delete" />
            <img src="Images/3Cut.png" id="CutButton" alt="Cut" />
            <img src="Images/4Copy.png" id="CopyButton" alt="Copy" />
            <img src="Images/5Paste.png" id="PasteButton"  alt="Paste"/>
            <img src="Images/6Lock.png" id="LockButton" alt="Lock" />
        </div>
        <div id="leftContent">
            <div id="Folders1">
                <ul class="filetree" id="rootNode">
                </ul>
            </div>
        </div>
    </div>
    <div id="right">
        <div id="rightContent">
        <div id="picture"></div>
        <div id="details"></div>
         <div id="modelhistory"></div>
        </div>
    </div>
</body>
</html>
