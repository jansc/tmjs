/*jslint browser: true, devel: true, onevar: true, undef: true,
  nomen: false, eqeqeq: true, plusplus: true, bitwise: true,
  regexp: true, newcap: true, immed: true */
/*global TM, window, DOMParser, ActiveXObject*/ 

TM.XTM20 = (function() {
    var ReaderImpl;

    ReaderImpl = function(tm) {
        this.tm = tm;
    };

    ReaderImpl.prototype.fromString = function(str) {
        var parser, xmldoc;
        if (window.DOMParser) {
            parser = new DOMParser();
            xmldoc = parser.parseFromString(str, "text/xml");
        } else {
            // IE
            xmldoc = new ActiveXObject("Microsoft.XMLDOM");
            xmldoc.async = "false";
            xmldoc.loadXML(str); 
        }
        return this.fromDOM(xmldoc);
    };

    ReaderImpl.prototype.fromDOM = function(node) {
        var root = node, n;
        if (node.nodeType === 9) { // document node
            root = node.documentElement;
        }
        if (root.nodeType !== 1 || root.nodeName.toLowerCase() !== 'topicmap') {
            return false;
        }
        for (n = root.firstChild; n; ) {
            if (n.nodeType === 3 && n.nodeValue.match(/\S/)) {
               // skip whitespace text nodes
            } else if (n.nodeType === 1) {
                if (n.nodeName === 'topic') {
                    this.parseTopic(n);
                } else if (n.nodeName === 'association') {
                    this.parseAssociation(n); 
                }
            } else {
                // invalid XTM
            }
            n = n.nextSibling; 
        }
        return true;
    };

    ReaderImpl.prototype.parseTopic = function(node) {
        //console.log("Topic = "+node.nodeName);
        // FIXME Work in progress
    };

    ReaderImpl.prototype.parseAssociation = function(node) {
        //console.log("Association = "+node.nodeName);
        // FIXME Work in progress
    };

    return {
        Reader: ReaderImpl
    };
}());

