function Fetch(params) {

    this.init = function(pobj) {
        this.url = ('url' in pobj) ? pobj.url : null;
        this.callback = ('callback' in pobj) ? pobj.callback : null;

        if (this.url && this.callback) {
            this.getIt();
        }
    };



    this.getIt = function() {
        console.log("GETting " + this.url);
        // return;

        var xhr = (window.XMLHttpRequest)
            ? (new XMLHttpRequest())
            : (new ActiveXObject("Microsoft.XMLHTTP"));
        xhr.open('GET', this.url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();

        var handler = this.handleTheReturn.bind(this);

        xhr.onreadystatechange = function() {
            if ((xhr.readyState == 4) && (xhr.status == 200)) {
                handler(xhr.responseText);
            }
        };
    };



    this.handleTheReturn = function(response) {
        // No need to check for the handler.
        // That happens in init.
        this.callback(response);
        this.reset();
    };



    this.reset = function() {
        this.url = null;
        this.callback = null;
    };



    // This needs to stay down here.
    if (typeof params == 'object') {this.init(params);}
    else {this.init({});}
}
