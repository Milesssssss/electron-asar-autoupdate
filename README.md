electron asar autoupdate


set code in index.html

```
    updater = require('electron-asar-autoupdate')
    updater.init({
        api: 'http://localhost:3400/update',
        appPath: __dirname + '/'
    })
    window.checkForUpdates = function () {
        EAU.check(function (error) {
            if (error) {
                if (error === 'no_update_available') {
                    return false;
                }
                alert(error);
                return false;
            }

            var apply = confirm("New Update Available.\nWould you like to update?");
            if (apply == true) {

                EAU.download(function (error) {
                    if (error) {
                        alert(error);
                        return false;
                    }
                    alert('App updated successfully! Restart it please.');
                });

            } else {
                return false;
            }

        });
    }

```