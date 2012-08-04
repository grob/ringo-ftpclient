// usage:
// ringo -i ftps.js

var {FtpsClient, FtpClient} = require("../lib/ftpclient");
var ftp = new FtpsClient("localhost", 2100, {
    "protocol": "tls",
    "useImplicitSsl": true
});
ftp.login("test", "test");
console.log(ftp.ls());