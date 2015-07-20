/* HTTP
 *
 * This is a simple object for making HTTP requests.
 *
 * The public methods indicate the HTTP verb that will be used
 * when they are called. They can receive the same parameter,
 * which is an object that should have the pertinent key-value
 * pairs as represented by the conf variable, less the `method`
 * key, which will be filled by the method.
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
 * and pass the response to function `handler`.
 */

var Http = (function () {

    var conf = {
        url: null,
        method: null,
        params: null,
        callback: null
    };



    function init(obj) {
        for (var key in obj) {
            if ((obj.hasOwnProperty(key)) &&
                (conf.hasOwnProperty(key))) {
                conf[key] = obj[key];
            }
        }
    }



    function reset() {
        for (var key in conf) {
            if (conf.hasOwnProperty(key)) {
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
                // console.log('GETting ' + conf.url + '?' + toParamString(conf.params));
                xhr.open(conf.method, conf.url + '?' + toParamString(conf.params));
            } else {
                // console.log('GETting ' + conf.url);
                xhr.open(conf.method, conf.url);
            }
            xhr.send();
        }

        else if (conf.method == 'post') {
            xhr.open(conf.method, conf.url);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            if (conf.params) {
                // console.log('POSTting ' + toParamString(conf.params) + ' to ' + conf.url);
                xhr.send(toParamString(conf.params));
            } else {
                // console.log('POSTting nothing to ' + conf.url);
                xhr.send();
            }
        }

        else {
            // console.log("Unsupported HTTP verb: " + conf.method);
        }

        var handler = wrapup.bind(this);

        xhr.onreadystatechange = function() {
            if ((xhr.readyState == 4) && (xhr.status == 200)) {
                handler(xhr.responseText);
            }
        };
    }



    function wrapup(response) {
        if (conf.callback) {
            // console.log("Sending " + response + " to " + conf.callback);
            conf.callback(response);
        }
        else {
            // console.log("No callback");
        }

        reset();
    }





    /*
     * Public methods.
     */

    return {
        get: function(obj) {
            init(obj);
            conf.method = 'get';
            makeRequest();
        },


        post: function(obj) {
            init(obj);
            conf.method = 'post';
            makeRequest();
        }
    };
})();
