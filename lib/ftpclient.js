addToClasspath("../jars/commons-net-3.1.jar");

var log = require("ringo/logging").getLogger(module.id);
var objects = require("ringo/utils/objects");
var fs = require("fs");
var {FTPClient, FTPSClient, FTPFileFilter} = org.apache.commons.net.ftp;
var {ASCII_FILE_TYPE , BINARY_FILE_TYPE} = org.apache.commons.net.ftp.FTP;

/**
 * Returns a newly created FtpClient instance
 * @class Instances of this class represent an FTP client, and provide methods
 * for listing, storing, retrieving and removing files on/from this server.
 * @param {String} host The host to connect to
 * @param {Number} port Optional port (defaults to 21)
 * @returns A newly created FtpClient instance
 * @constructor
 */
var FtpClient = exports.FtpClient = function(host, port) {

    var client = new FTPClient();

    Object.defineProperties(this, {
        /**
         * The FQDN or Ip-Address of the FTP-Server
         * @type String
         */
        "host": {"value": host, "enumerable": true},

        /**
         * The port to connect to
         * @type Number
         */
        "port": {"value": port || 21, "enumerable": true},

        /**
         * The wrapped FTPClient instance
         * @type org.apache.commons.net.ftp.FTPClient
         */
        "client": {"value": client, "enumerable": true}
    });

    return this;
};

/**
 * Constant for binary transfer mode
 * @type {Number}
 */
FtpClient.BINARY = BINARY_FILE_TYPE;

/**
 * Constant for ASCII transfer mode
 * @type {Number}
 */
FtpClient.ASCII = ASCII_FILE_TYPE;

/** @ignore */
FtpClient.prototype.toString = function() {
    return "[FtpClient @" + this.host + "]";
};

/**
 * Connects to the remote server
 */
FtpClient.prototype.connect = function() {
    if (this.client.isConnected()) {
        throw new Error("FtpClient: already connected");
    }
    return this.client.connect(this.host, this.port) &&
            this.client.setFileType(FtpClient.BINARY);
};

/**
 * Disconnects from the remote server
 */
FtpClient.prototype.disconnect = function() {
    return this.client.isConnected() && this.client.disconnect();
};

/**
 * Logs into the remote server using the credentials passed as argument
 * @param {String} username The username
 * @param {String} password The password
 * @returns {Boolean} True if login was successful, false otherwise
 */
FtpClient.prototype.login = function(username, password) {
    if (!this.client.isConnected()) {
        this.connect();
    }
    return this.client.login(username, password);
};

/**
 * Logs out from the remote server and disconnects
 */
FtpClient.prototype.logout = function() {
    this.client.logout();
    this.disconnect();
};

/**
 * Changes the current working directory
 * @param {String} path The path to the new working directory
 * @param {Boolean} create If true the new working directory is created if it doesn't exist
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.cd = function(path, create) {
    if (this.client.changeWorkingDirectory(path) !== true) {
        if (create === true) {
            return this.mkdir(path) && this.cd(path, false);
        }
        return false;
    }
    return true;
};

/**
 * Creates a directory
 * @param {String} path The name of the directory to create
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.mkdir = function(path) {
    return this.client.makeDirectory(path);
};

/**
 * Returns the current working directory
 * @returns {String} The current working directory
 */
FtpClient.prototype.pwd = function() {
    return this.client.printWorkingDirectory();
};

/**
 * Switches this client to binary transfer mode
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.setBinaryMode = function() {
    return this.client.setFileType(FtpClient.BINARY);
};

/**
 * Switches this client to ASCII transfer mode
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.setAsciiMode = function() {
    return this.client.setFileType(FtpClient.ASCII);
};

/**
 * Stores the file passed as argument on the remote server, using an optional
 * file name
 * @param {String} file The file to store on the remote server
 * @param {String} fileName Optional file name (defaults to the name of the file
 * being transferred)
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.put = function(file, fileName) {
    fileName = fileName || fs.base(file);
    log.debug("transferring " + fs.base(file) +
        " as " + fileName + " to " + this.host);
    var stream = null;
    try {
        stream = fs.openRaw(file);
        if (this.client.storeFile(fileName, stream) !== true) {
            log.error("unable to store file!");
            return false;
        }
        return true;
    } finally {
        if (stream !== null) {
            stream.close();
        }
    }
};

/**
 * Retrieves the file from the remote server and stores it locally
 * @param {String} fileName The name of the file to retrieve
 * @param {String} localPath The local path to store the file at. If it's a
 * directory the file is stored therein.
 * @returns {String} The path to the local file
 */
FtpClient.prototype.get = function(fileName, localPath) {
    if (fs.exists(localPath) && fs.isDirectory(localPath)) {
        localPath = fs.join(localPath, fileName);
    }
    if (fs.exists(localPath)) {
        throw new Error("FtpClient: local file " + localPath + " already exists");
    }
    log.debug("retrieving " + fileName + " from " +
            this.host + " to " + localPath);
    var stream = null;
    try {
        stream = fs.openRaw(localPath, {
            "write": true
        });
        if (this.client.retrieveFile(fileName, stream) === true) {
            return localPath;
        }
    } finally {
        if (stream !== null) {
            stream.close();
        }
    }
    return null;
};

/**
 * Removes the file with the given name from the remote server
 * @param {String} fileName The name of the file
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.rm = function(fileName) {
    log.debug("removing " + fileName + " from " + this.host);
    if (this.client.deleteFile(fileName) !== true) {
        log.error("unable to remove the file " + fileName);
        return false;
    }
    return true;
};

/**
 * Removes the directory with the given name from the remote server
 * @param {String} path The path to the directory to remove
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.rmdir = function(path) {
    log.debug("removing directory " + path + " from " + this.host);
    if (this.client.removeDirectory(path) !== true) {
        log.error("unable to remove the directory " + path);
        return false;
    }
    return true;
};

/**
 * Lists the contents of the current working directory of this client
 * @param {String} path The path to the directory
 * @param {org.apache.commons.net.ftp.FTPFileFilter} filter An optional file filter
 * @returns {Array} An array containing org.apache.commons.net.ftp.FTPFile instances
 */
FtpClient.prototype.ls = function(path, filter) {
    if (arguments.length === 0) {
        return this.client.listFiles();
    } else if (arguments.length === 1) {
        if (path instanceof FtpFileFilter) {
            return this.client.listFiles(null, path);
        }
        return this.client.listFiles(path);
    }
    return this.client.listFiles(path, filter);
};

/**
 * Returns an array containing subdirectories
 * @param {String} path The path to the parent directory
 * @returns {Array} An array containing org.apache.commons.net.ftp.FTPFile instances
 */
FtpClient.prototype.lsdir = function(path) {
    return this.client.listDirectories(path);
};

/**
 * Renames a file on the remote server
 * @param {String} from The path of the file to rename
 * @param {String} to The path to rename the file to
 * @returns {Boolean} True if successful
 */
FtpClient.prototype.rename = function(from, to) {
    return this.client.rename(from, to);
};

/**
 * Switches this client to passive mode
 */
FtpClient.prototype.enablePassiveMode = function() {
    return this.client.enterLocalPassiveMode();
};

/**
 * Switches this client to active mode
 */
FtpClient.prototype.enableActiveMode = function() {
    return this.client.enterLocalActiveMode();
};

/**
 * Instances of this class represent a file filter
 * @param {Function} accept A function called for each FTPFile. If this method
 * returns true the file is part of a listing result
 * @returns A newly created FtpFileFilter instance
 * @constructor
 */
var FtpFileFilter = exports.FtpFileFilter = function(accept) {
    return new FTPFileFilter({
        "accept": accept
    });
};

/**
 * Returns a newly created FtpsClient instance
 * @class Instances of this class represent an FTPS client, and provide methods
 * for listing, storing, retrieving and removing files on/from this server.
 * @param {String} host The host to connect to
 * @param {Number} port Optional port (defaults to 990)
 * @returns A newly created FtpsClient instance
 * @constructor
 */
var FtpsClient = exports.FtpsClient = function(host, port, opts) {

    var options = objects.merge(opts, {
        "useImplicitSsl": true,
        "protocol": "TLS"
    });

    var client = new FTPSClient(options.protocol, options.useImplicitSsl !== false);

    Object.defineProperties(this, {
        /**
         * The FQDN or Ip-Address of the FTP-Server
         * @type String
         */
        "host": {"value": host, "enumerable": true},

        /**
         * The port to connect to
         * @type Number
         */
        "port": {"value": port || 990, "enumerable": true},

        /**
         * The wrapped FTPClient instance
         * @type org.apache.commons.net.ftp.FTPClient
         */
        "client": {"value": client, "enumerable": true}
    });

    return this;
};
/** @ignore */
FtpsClient.prototype = Object.create(FtpClient.prototype);
/** @ignore */
FtpsClient.prototype.constructor = FtpsClient;

/** @ignore */
FtpsClient.prototype.toString = function() {
    return "[FtpsClient @" + this.host + "]";
};
