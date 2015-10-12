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

    // This correlates a URL with its request object for properly
    // calling its callback after the request is made.
    var async_keep = { };

    // This is the shape of the argument passed to one of the public
    // methods. Each key is required for each request. If a key is
    // missing, it will be filled with the value specified here.
    // The other keys required by `makeRequest` will be filled by
    // the `prep(Get|Post)Args` methods.
    var proto_req = {
        url: null,                       // Required.
        params: null,                    // Optional.
        callback: null,                  // Recommended.
        send_url: send_url_to_callback,  // Optional.
        verbose: verbose                 // Optional.
    };



    function makeRequestObject(args) {
        verbose = (args.hasOwnProperty('verbose') && args.verbose) ? true : verbose;

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

        return req_obj;
    }



    function prepGetArgs(args) {
        var req_obj = makeRequestObject(args);

        req_obj.verb = 'get';

        req_obj.open_url = (req_obj.params)
            ? req_obj.url + '?' + toParamString(req_obj.params)
            : req_obj.url;

        req_obj.send_val = null;

        return req_obj;
    }



    function prepPostArgs(args) {
        var req_obj = makeRequestObject(args);

        req_obj.verb = 'post';
        req_obj.open_url = req_obj.url;
        req_obj.send_val = (req_obj.params)
            ? toParamString(req_obj.params)
            : null;

        return req_obj;
    }



    // The public methods will pass a prepared package of arguments
    // representing the request.
    function init(req_obj) {
        if (verbose) {
            console.log("Initializing '"+req_obj.verb+"' call to http with:");
            console.log(req_obj);
        }

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
        if (verbose) {
            console.log('Making ' + req_obj.verb + ' request to ' + req_obj.open_url);
        }

        async_keep[req_obj.url] = req_obj;

        var xhr = (window.XMLHttpRequest)
            ? (new XMLHttpRequest())
            : (new ActiveXObject("Microsoft.XMLHTTP"));

        xhr.open(req_obj.verb, req_obj.open_url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        if (req_obj.send_val) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(req_obj.send_val);
        }
        else {
            xhr.send();
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
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
            if (typeof async_keep[url].callback === 'function') {
                if (verbose) {
                    console.log("Sending response to callback function.");
                }

                if (async_keep[url].send_url) {
                    async_keep[url].callback(response, url);
                }
                else {
                    async_keep[url].callback(response);
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
        get: function(args) {
            init(prepGetArgs(args));
        },

        post: function(args) {
            init(prepPostArgs(args));
        }
    };
})();
