// usage:
// ringo -i ftp.js

var {FtpsClient, FtpClient} = require("../lib/ftpclient");
var ftp = new FtpClient("localhost", 2100);
ftp.login("test", "test");
console.log(ftp.ls());
