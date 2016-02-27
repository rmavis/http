/*
 * HTTP
 *
 * This is a module for handling HTTP requests.
 *
 * Currently-supported HTTP methods:
 * - GET
 * - POST
 * - PUT
 * - DELETE
 *
 *
 * USAGE
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
 * A DELETE request looks just like a GET request, except the verb
 * is different.
 *
 * This:
 * Http.post({ url: "http://example.com",
 *             json: {foo:"bar", boo:"bat"},
 *             callback: handler });
 *
 * will generate this request:
 * POST http://example.com '{"foo":"bar","boo":"bat"}'
 *
 * and pass the response to the function `handler`.
 *
 * As with GET and DELETE, a PUT request is nearly identical to a
 * POST request.
 *
 *
 * DEPENDENCIES
 *
 * None.
 *
 *
 * DETAILS
 *
 * The names of the public methods indicate the HTTP verb that will
 * be used. They can all take the same parameter, which is an object
 * containing these keys:
 * - url, being the URL you want to request
 * - params, being the data you want to pass to the URL, or
 *   json, which is the same but treated differently, or
 *   raw_data, likewise -- see below
 * - callback, being the function you want to receive the response
 * - send_url, being a boolean indicating whether you want the URL
 *   to be sent to the callback along with the response.
 * - send_url, which is a boolean indicating whether the request's
 *   URL should be sent to the callback in addition to the response
 * - headers, being an object representing key-value pairs to send
 *   as headers with the request
 * - verbose, for logging
 *
 * To send values with a `GET` or `DELETE` request, use the `params`
 * key. For `POST` or `PUT`, the key used will determine which
 * `Content-Type` header will be added and how the values will be
 * modified prior to making the request. If the key is `json`, then
 * that header will be set to `application/json;charset=UTF-8` and
 * the object will be `stringify`'d. If the key is `raw_data`, then
 * the object will not be modified before sending it.
 *
 */

var Http = (function () {

    // For logging.
    var verbose = false;

    // Whether to send the callback the URL along with the response.
    // If true, it will be the callback's second parameter.
    var send_url_to_callback = true;

    // This correlates a URL with its request object for properly
    // calling its callback after the request is made.
    var async_keep = { };

    // This is the shape of the argument passed to one of the public
    // methods. Each key is required for each request. If a key is
    // missing, it will be filled with the value specified here.
    // The other keys required by `makeRequest` will be filled in
    // other functions.
    function getDefaultRequestObject() {
        return {
            url: null,                       // Required.
            params: null,                    // Optional.
            json: null,                      // Optional.
            raw_data: null,                  // Optional.
            callback: null,                  // Recommended.
            send_url: send_url_to_callback,  // Optional.
            verbose: verbose,                // Optional.
            headers: { }                     // Optional.
        }
    }



    // This function takes the user-provided parameters, sieves them
    // into the defaults, adds the `keep_key` for the `async_keep`.
    function makeRequestObject(args) {
        verbose = (args.hasOwnProperty('verbose') && args.verbose) ? true : verbose;

        var proto_req = getDefaultRequestObject(),
            req_obj = { };

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

        req_obj['keep_key'] = req_obj.url + '-' + (new Date().getTime());

        return addRequestHeaders(req_obj);
    }



    function addRequestHeaders(req_obj) {
        if (!req_obj.headers['X-Requested-With']) {
            req_obj.headers['X-Requested-With'] = 'XMLHttpRequest';
        }

        if ((req_obj.json) && (!req_obj.headers['Content-Type'])) {
            req_obj.headers['Content-Type'] = 'application/json;charset=UTF-8';
        }
        else if (!req_obj.headers['Content-Type']) {
            req_obj.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        return req_obj;
    }



    function prepGetArgs(args, verb) {
        verb = (typeof verb == 'string') ? verb : 'get';

        var req_obj = makeRequestObject(args);

        req_obj.verb = verb;

        req_obj.open_url = (req_obj.params)
            ? req_obj.url + '?' + toParamString(req_obj.params)
            : req_obj.url;

        req_obj.send_val = null;

        return req_obj;
    }



    // If POSTing data using a FormData object, then that object
    // should be passed to `Http` with the `raw_data` key.
    function prepPostArgs(args, verb) {
        verb = (typeof verb == 'string') ? verb : 'post';

        var req_obj = makeRequestObject(args);

        req_obj.verb = verb;
        req_obj.open_url = req_obj.url;
        req_obj.send_val = null;

        var send_opts = [
            ['params', toParamString],
            ['json', JSON.stringify],
            ['raw_data', null]
        ];

        for (var o = 0, m = send_opts.length; o < m; o++) {
            if (req_obj[send_opts[o][0]]) {
                req_obj.send_val = (send_opts[o][1])
                    ? send_opts[o][1](req_obj[send_opts[o][0]])
                    : req_obj[send_opts[o][0]];
            }
        }

        // if (req_obj.params) {
        //     req_obj.send_val = toParamString(req_obj.params);
        // }
        // else if (req_obj.json) {
        //     req_obj.send_val = JSON.stringify(req_obj.json);
        // }
        // else if (req_obj.raw_data) {
        //     req_obj.send_val = req_obj.raw_data;
        // }
        // else {
        //     req_obj.send_val = null;
        // }

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
            console.log('And sending:');
            console.log(req_obj.send_val);
        }

        async_keep[req_obj.keep_key] = req_obj;

        var xhr = (window.XMLHttpRequest)
            ? (new XMLHttpRequest())
            : (new ActiveXObject("Microsoft.XMLHTTP"));

        xhr.open(req_obj.verb, req_obj.open_url);

        for (var key in req_obj.headers) {
            if (req_obj.headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, req_obj.headers[key]);
            }
        }

        if (req_obj.send_val) {
            // This is not necessary when sending a FormData object.
            // FormData should be passed to `Http` with the `raw_data` key,
            // with no `params`.
            // if (req_obj.params) {
            //     xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            // } else {
            //     xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            // }

            xhr.send(req_obj.send_val);
        }

        else {
            xhr.send();
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.responseText) {
                    handleReturn(req_obj.keep_key, req_obj.url, xhr.responseText);
                }
                else {
                    handleReturn(req_obj.keep_key, req_obj.url);
                }
            }
        };
    }



    function handleReturn(keep_key, url, response) {
        if (verbose) {
            console.log("Received response from "+url+": " + response);
        }

        console.log("Async keep:");
        console.log(async_keep);

        if (async_keep[keep_key]) {
            if (typeof async_keep[keep_key].callback === 'function') {
                if (verbose) {
                    console.log("Sending response to callback function.");
                }

                if (async_keep[keep_key].send_url) {
                    async_keep[keep_key].callback(response, url);
                }
                else {
                    async_keep[keep_key].callback(response);
                }
            }

            else {
                if (verbose) {
                    console.log("No callback function.");
                }
            }

            delete async_keep[keep_key];
        }

        else {
            console.log("HTTP DISASTER: no state retained for '"+keep_key+"' prior to making request.");
        }
    }



    function toParamString(obj) {
        var parts = [ ];

        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                parts.push(key + '=' + encodeURIComponent(obj[key]));
                // encodeURIComponent(key)
            }
        }

        return parts.join('&');
    }





    /*
     * Public methods.
     */

    return {
        get: function(args) {
            init(prepGetArgs(args));
        },

        delete: function(args) {
            init(prepGetArgs(args, 'delete'));
        },

        post: function(args) {
            init(prepPostArgs(args));
        },

        put: function(args) {
            init(prepPostArgs(args, 'put'));
        }
    };
})();
