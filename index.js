const FileSystem = require('original-fs')
const _ = require('lodash')
const path = require('path')
const request = require('request')

class Updater {

    constructor() {
        this.setup = {
            api: '',
            appPath: '',
            appPathFolder: '',
            requestOption: {},
            callback: false
        }
    }

    static log(msg) {
        console.log(msg)
    }

    init(setup) {
        this.setup = _.extend(this.setup, setup)
        this.setup.appPathFolder.slice(0, this.setup.appPath.indexOf("app.asar"))
    }

    end(error) {
        if (typeof this.setup.callback != 'function') return false
        this.setup.callback.call(this,
            ( error != 'undefined' ? errors[error] : false ),
            this.update.last)
    }

    check(callback) {
        if (callback) {
            this.setup.callback
        }

        let packageInfo = require(this.setup.appPath + 'package.json')
        let currentVersion = packageInfo.version
        if (!currentVersion) {
            this.log('The "version" property not specified inside the application package.json')
            this.end(0)
            return false
        }

        let that = this

        request({
            url: this.setup.api + '?version=' + version,
            method: 'get',
            timeout: 2 * 60
        }, function (error, response, body) {
            if (error) {
                that.end(0)
                return false
            }

            if (response.statusCode == 200) {
                that.log(body)
                let result = body

                if (!result.last) {
                    throw false
                }
                // Update available
                if (result.source) {
                    that.log('Update available: ' + result.last)

                    that.update = result

                    // Ask user for confirmation
                    that.end()

                } else {
                    that.log('No updates available')
                    that.end(2)
                    return false
                }
            } else {
                throw false
            }
        })
    }

    download(callback) {
        if (callback) {
            this.setup.callback = callback
        }

        let that = this
        let url = this.update.source, fileName = 'update.asar'
        let dist = path.join(this.setup.appPathFolder, fileName)

        this.log('Downloading:' + url)

        try {
            request
                .get(url)
                .on('error', function (err) {
                    console.log(err)
                })
                .on('end', function () {
                    that.update.file = dist
                    that.log('Update downloaded: ' + dist)
                    that.apply()
                })
                .pipe(FileSystem.createWriteStream(dist))
        } catch (err) {
            this.log('Downloaded error.')
        }
    }

    apply() {
        let that = this
        try {
            FileSystem.unlink(this.setup.appPath.slice(0, -1), function (err) {
                if (err) {
                    return console.error(err)
                }
                that.log("Asar deleted successfully.")
            })
        } catch (error) {
            that.log('Delete error: ' + error)

            // Failure
            that.end(6)
        }

        try {
            FileSystem.rename(this.update.file, this.setup.appPath.slice(0, -1), function (err) {
                if (err) {
                    return console.error(err)
                }
                that.log("Update applied.")
            })

            that.log('End of update.')
            // Success
            that.end()

        } catch (error) {
            that.log('Rename error: ' + error)

            // Failure
            that.end(6)
        }
    }
}

module.exports = new Updater()