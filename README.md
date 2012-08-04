# ringo-ftpclient

## About

*ringo-ftpclient* is a lightweight Javascript wrapper around [Apache Commons FTPClient](http://commons.apache.org/net/) suitable for use with [RingoJS](http://ringojs.org/).

## Status

Although the underlying [Apache Commons FTPClient](http://commons.apache.org/net/) is stable, ringo-ftpclient should **be considered beta**.

## License

[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

## Installation

As with all RingoJS packages, unzip the contents of the distribution archive into the `packages` directory inside the RingoJS home directory. Alternatively you can place it anywhere outside and create a symbolic link inside the `packages` directory.

## Usage

    // require the ringo-ftpclient module
    var {FtpClient} = require("ringo-ftpclient");
    
    // create a new instance of FtpClient (arguments: host/port)
    var ftp = new FtpClient("localhost", 2100);
    
    // log in to remote server and make what
    ftp.login("test", "test");
    ftp.ls().length;
    ftp.logout();

