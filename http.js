/* HTTP
 *
 * This is a simple object for making HTTP requests.
 *
 * The names of the public methods indicate the HTTP verb that will
 * be used when they are called. They can receive the same parameter,
 * which is an object containing the keys
 * - url: the URL you want to request
 * - params: the data you want to pass to the URL
 * - callback: the function you want to receive the response
 *
 * For logging, you can also include a `verbose` key in the object.
 * If that is true, then messages will be printed to the console
 * through the lifecycle of the procedure. Alternatively, you can
 * set the `verbose` variable to true.
 *
 *
 * EXAMPLES
 *
 * This:
 * Http.get({ url: "http://example.com",
 *            params: {foo:"bar", boo:"bat"},
 *            callback: handler });
 * will generate the request:
 * GET http://example.com?foo=bar&boo=bat
 * and pass the response to the function `handler`.
 */

var Http = (function () {

    // Make this true to see console messages.
    var verbose = null;


    // The parameter to the public methods has this shape
    // except the `method` key, which gets filled in.
    var conf = {
        url: null,       // Required.
        params: null,    // Optional.
        callback: null,  // Optional. Recommended.
        verbose: null,   // Optional. Defaults to the above.
        method: null     // Filled by public method.
    };



    function init(obj, verb) {
        conf.verbose = (obj.hasOwnProperty('verbose')) ? obj.verbose : verbose;

        log("Initializing '" + verb + "' call to http with:");
        log(obj);

        for (var key in obj) {
            if ((obj.hasOwnProperty(key)) &&
                (conf.hasOwnProperty(key))) {
                log("Filling conf key '" + key + "' with value '" + obj[key] + "'.");
                conf[key] = obj[key];
            }
        }

        if (conf.url) {
            conf.method = verb;
            makeRequest();
            // reset() is called in handleReturn()
            // which is called in makeRequest()
            // so everything happens in order.
        }
        else {
            log("Aborting: no URL.");
        }
    }



    function reset() {
        for (var key in conf) {
            if (conf.hasOwnProperty(key)) {
                log("Resetting conf key '" + key + "' to null.");
                conf[key] = null;
            }
        }
    }



    function makeRequest() {
        var xhr = (window.XMLHttpRequest)
            ? (new XMLHttpRequest())
            : (new ActiveXObject("Microsoft.XMLHTTP"));

        if (conf.method == 'get') {
            if (conf.params) {
                log('GETting ' + conf.url + '?' + toParamString(conf.params));
                xhr.open(conf.method, conf.url + '?' + toParamString(conf.params));
            }
            else {
                log('GETting ' + conf.url);
                xhr.open(conf.method, conf.url);
            }
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();
        }

        else if (conf.method == 'post') {
            xhr.open(conf.method, conf.url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            if (conf.params) {
                log('POSTing ' + toParamString(conf.params) + ' to ' + conf.url);
                xhr.send(toParamString(conf.params));
            }
            else {
                log('POSTing nothing to ' + conf.url);
                xhr.send();
            }
        }

        else {
            log("Unsupported HTTP verb: " + conf.method);
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.responseText) {
                    handleReturn(xhr.responseText);
                }
                else {
                    handleReturn();
                }
            }
        };
    }



    function handleReturn(response) {
        log("Received response: " + response);

        if (conf.callback) {
            log("Sending response to " + conf.callback);
            conf.callback(response);
        }
        else {
            log("No callback.");
        }

        reset();
    }



    function toParamString(obj) {
        var ret = '';

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret +=
                    encodeURIComponent(key) +
                    '=' +
                    encodeURIComponent(obj[key]) +
                    '&';
            }
        }

        return ret.substr(0, (ret.length - 1));
    }



    function log(message) {
        if (conf.verbose) {
            console.log(message);
        }
    }





    /*
     * Public methods.
     */

    return {
        get: function(obj) {
            init(obj, 'get');
        },

        post: function(obj) {
            init(obj, 'post');
        }
    };
})();
