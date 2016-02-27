# HTTP

This is a module for handling HTTP requests.

Currently-supported HTTP methods:
- GET
- POST
- PUT
- DELETE


# Usage

This:
```
Http.get({ url: "http://example.com",
           params: {foo:"bar", boo:"bat"},
           callback: handler });
```

will generate this request:
```
GET http://example.com?foo=bar&boo=bat
```

and pass the response to the function `handler`.

A `DELETE` request looks just like a `GET` request, except the verb
is different.

This:
```
Http.post({ url: "http://example.com",
            json: {foo:"bar", boo:"bat"},
            callback: handler });
```

will generate this request:
```
POST http://example.com '{"foo":"bar","boo":"bat"}'
```

and pass the response to the function `handler`.

As with `GET` and `DELETE`, a `PUT` request is nearly identical to a
`POST` request.


# Details

The names of the public methods indicate the HTTP verb that will
be used. They can all take the same parameter, which is an object
containing these keys:
- `url`, being the URL you want to request
- `params`, being the data you want to pass to the URL, or
  - `json`, which is the same but treated differently, or
  - `raw_data`, likewise -- see below
- `callback`, being the function you want to receive the response
- `send_url`, being a boolean indicating whether you want the URL
  to be sent to the callback along with the response.
- `send_url`, which is a boolean indicating whether the request's
  URL should be sent to the callback in addition to the response
- `headers`, being an object representing key-value pairs to send
  as headers with the request
- `verbose`, for logging
