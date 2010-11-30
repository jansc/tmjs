// Helper functions needed by most unittests
// Copyright (c) 2010 Jan Schreiber <jans [at] ravn.no>
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

/*jslint browser: true, devel: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true */
/*global  TopicMapSystem, TopicMapSystemFactory*/ 

var TMUnitTest = {
addCommonSetupFunctions:
    function (obj) {
        var tmsf;
        obj._defaultAddress = "http://www.tmapi.org/tmapi2.0";
        tmsf = TopicMapSystemFactory.newInstance();
        obj._tms = tmsf.newTopicMapSystem();
        obj._defaultLocator = obj._tms.createLocator(obj._defaultAddress);
        obj._tm = obj._tms.createTopicMap(obj._defaultLocator);
        obj.createLocator = function(iri) { return obj._tms.createLocator(iri); };
        obj.createTopicMap = function(iri) {
            return obj._tms.createTopicMap(obj.createLocator(iri));
        };
        obj.createTopic = function() {
            return obj._tm.createTopic();
        };
        obj.createOccurrence = function() {
            return obj.createTopic().createOccurrence(obj.createTopic(), "foo");
        };
        obj.createName = function() {
            return obj.createTopic().createName("foo", obj.createTopic());
        };
        obj.createVariant = function() {
            return obj.createTopic().createName("foo").createVariant("bar",
                obj._tm.createLocator(obj._XSD_STRING),
                obj.createTopic());
        };
        obj.createDatatypeAware = function(iri) {
            return obj.createOccurrence();
        };
        obj.createAssociation = function() {
            return obj._tm.createAssociation(obj.createTopic());
        };
        obj.createRole = function() {
            return obj._tm.createAssociation(obj.createTopic()).createRole(
                    obj.createTopic(), this.createTopic());
        };
        obj.removeTopicMap = function (iri) {
            var tm = obj._tms.getTopicMap(obj.createLocator(iri));
            tm.remove();
        };

        obj.removeAllTopicMaps = function () {
            var locs = obj._tms.getLocators(), i;
            for (i=0; i<locs.length; i=i+1) {
                obj.removeTopicMap(locs[i].getReference());
            }
        };

        obj._XSD = "http://www.w3.org/2001/XMLSchema#";
        obj._XSD_STRING = obj._XSD + "string";
        obj._XSD_INTEGER = obj._XSD + "integer";
        obj._XSD_INT = obj._XSD + "int";
        obj._XSD_FLOAT = obj._XSD + "float";
        obj._XSD_DECIMAL = obj._XSD + "decimal";
        obj._XSD_LONG = obj._XSD + "long";
        obj._XSD_ANY_URI = obj._XSD + "anyURI";
        obj._xsdString = obj.createLocator(obj._XSD_STRING);
        obj._xsdInteger = obj.createLocator(obj._XSD_INTEGER);
        obj._xsdInt = obj.createLocator(obj._XSD_INT);
        obj._xsdFloat = obj.createLocator(obj._XSD_FLOAT);
        obj._xsdDecimal = obj.createLocator(obj._XSD_DECIMAL);
        obj._xsdLong = obj.createLocator(obj._XSD_LONG);
        obj._xsdAnyURI = obj.createLocator(obj._XSD_ANY_URI);

        obj.assertFailInteger = function(dt) {
            obj.assertRaise('NumberFormatException', function() {
                dt.integerValue();
            }, "Expected a failure for converting the value to 'Integer'");
        };
        obj.assertFailFloat = function(dt) {
            obj.assertRaise('NumberFormatException', function() {
                dt.floatValue();
            }, "Expected a failure for converting the value to 'Float'");
        };
        obj.compareCXTM = function(test, filename, cxtmdir) {
            var tm, writer, reader, cxtm, jtm = null, baseline = null, obj, error = false;
            $.ajax({async: false, url: './cxtm/' + cxtmdir + '/in/'+filename,
                success: function (data, statusText, xmlHttpRequest) { jtm = data; }});
            $.ajax({async: false, url: './cxtm/' + cxtmdir + '/baseline/'+filename+'.cxtm',
                success: function (data, statusText, xmlHttpRequest) { baseline = data; }});
            tm = test.createTopicMap(filename);
            test.assertNotNull(jtm);
            test.assertNotNull(baseline);
            test.assertNotNull(tm);
            obj = $.parseJSON(jtm);
            test.assertNotNull(obj);

            try {
                reader = new TM.JTM.Reader(tm);
                reader.fromObject(obj);
                writer = new TM.CXTM.Writer();
                test.assertNotNull(writer);
                cxtm = writer.toString(tm);
                test.assertEqual(baseline, cxtm, "CXTM error in "+filename);
            } catch(e) {
                console.dir(e);
                error = true;
            }
            test.assertEqual(false, error, "Exception in "+filename);
            if (!error) {
                if (baseline !== null && baseline === cxtm) {
                    okCount += 1;
                    console.log(filename+" OK");
                } else {
                    failCount += 1;
                    console.log(filename+" failed");
                }
            } else {
                exceptionCount += 1;
                console.log("An exception was thrown in "+filename);
            }
            tm.remove();
        };

        // Add a function that checks if the array contains the element elem
        // Equal is checked with the comp function
        Array.prototype.contains = function(elem) {
            for (var key in this) {
                if (this.hasOwnProperty(key)) {
                    if (this[key].equals(elem)) { return true; }
                }
            }
            return false;
        };
    },

addCommonTeardownFunctions:
    function (obj) {
        obj.removeAllTopicMaps();
        delete Array.prototype.contains;
    }
};

