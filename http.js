/*
 * HTTP
 *
 * This is a module for making HTTP requests.
 *
 * The names of the public methods indicate the HTTP verb that will
 * be used when they are called. They can receive the same parameter,
 * which is an object containing these keys:
 * - url, being the URL you want to request
 * - params, being the data you want to pass to the URL
 * - callback, being the function you want to receive the response
 * - send_url, being a boolean indicating whether you want the URL
 *   to be sent to the callback along with the response.
 *
 * For logging, you can also include a `verbose` key in the object.
 * If that is true, then messages will be printed to the console
 * through the lifecycle of the procedure. Alternatively, you can
 * set the `verbose` global variable to true.
 *
 *
 * EXAMPLES
 *
 * This:
 * Http.get({ url: "http://example.com",
 *            params: {foo:"bar", boo:"bat"},
 *            callback: handler });
 *
 * will generate this request:
 * GET http://example.com?foo=bar&boo=bat
 *
 * and pass the response to the function `handler`.
 *
 */

var Http = (function () {

    // For logging.
    var verbose = false;

    // Whether to send the callback the URL along with the response.
    // If true, it will be the second parameter.
    var send_url_to_callback = true;

    // This correlates a URL with its callback function for calling
    // after the request is made.
    var async_keep = { };

    // This is the shape of the argument passed to one of the public
    // methods. Each key is required for each request. If a key is
    // missing, it will be filled with the value specified here.
    var proto_req = {
        url: null,                       // Required.
        params: null,                    // Optional.
        callback: null,                  // Recommended.
        send_url: send_url_to_callback,  // Optional.
        verbose: verbose                 // Optional.
    };



    function makeRequestObject(args, verb) {
        var req_obj = { };

        for (var key in proto_req) {
            if (proto_req.hasOwnProperty(key)) {
                if (args.hasOwnProperty(key)) {
                    if (verbose) {
                        console.log("Filling request key '"+key+"' with value '"+args[key]+"'.");
                    }

                    req_obj[key] = args[key];
                }

                else {
                    if (verbose) {
                        console.log("Filling request key '"+key+"' with default '"+proto_req[key]+"'.");
                    }

                    req_obj[key] = proto_req[key];
                }

            }
        }

        if (verbose) {
            console.log("Filling request HTTP verb with '"+verb+"'.");
        }

        req_obj.verb = verb;

        return req_obj;
    }



    // The args are filled by the user.
    // The verb is filled by the public function.
    function init(args, verb) {
        verbose = (args.hasOwnProperty('verbose')) ? args.verbose : verbose;

        if (verbose) {
            console.log("Initializing '"+verb+"' call to http with:");
            console.log(args);
        }

        var req_obj = makeRequestObject(args, verb);        

        if (req_obj.url) {
            makeRequest(req_obj);
        }
        else {
            if (verbose) {
                console.log("Aborting HTTP request: no URL.");
            }
        }
    }



    function makeRequest(req_obj) {
        async_keep[req_obj.url] = req_obj;

        var xhr = (window.XMLHttpRequest)
            ? (new XMLHttpRequest())
            : (new ActiveXObject("Microsoft.XMLHTTP"));

        if (req_obj.verb == 'get') {
            if (req_obj.params) {
                if (verbose) {
                    console.log('GETting ' + req_obj.url + '?' + toParamString(req_obj.params));
                }

                xhr.open(req_obj.verb, req_obj.url + '?' + toParamString(req_obj.params));
            }

            else {
                if (verbose) {
                    console.log('GETting ' + req_obj.url);
                }

                xhr.open(req_obj.verb, req_obj.url);
            }

            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.send();
        }

        else if (req_obj.verb == 'post') {
            xhr.open(req_obj.verb, req_obj.url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

            if (req_obj.params) {
                if (verbose) {
                    console.log('POSTing ' + toParamString(req_obj.params) + ' to ' + req_obj.url);
                }

                xhr.send(toParamString(req_obj.params));
            }
            else {
                if (verbose) {
                    console.log('POSTing nothing to ' + req_obj.url);
                }

                xhr.send();
            }
        }

        else {
            if (verbose) {
                console.log("Unsupported HTTP verb: " + req_obj.verb);
            }
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.responseText) {
                    handleReturn(req_obj.url, xhr.responseText);
                }
                else {
                    handleReturn(req_obj.url);
                }
            }
        };
    }



    function handleReturn(url, response) {
        if (verbose) {
            console.log("Received response from "+url+": " + response);
        }

        if (async_keep[url]) {
            if (typeof async_keep[url].callback == 'function') {
                if (verbose) {
                    console.log("Sending response to callback function.");
                }

                if (async_keep[url].send_url) {
                    async_keep[url].callback(response, url);
                }
                else {
                    async_keep[url](response);
                }
            }

            else {
                if (verbose) {
                    console.log("No callback function.");
                }
            }

            delete async_keep[url];
        }

        else {
            console.log("HTTP DISASTER: no state retained for '"+url+"' prior to making request.");
        }
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
