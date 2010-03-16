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

/*jslint browser: true, devel: true, onevar: true, undef: true,
  nomen: false, eqeqeq: true, plusplus: true, bitwise: true,
  regexp: true, newcap: true, immed: true */

// TODO: Still unsure how to handle int, Integer, Decimal
// Should probably provide support for javascript types:
// - Number
// - String
// - Boolean
// - Function?
// - Array?
// - Date
// - Object

var datatypeAware = {
    testString: function() {
        var dt = this.createDatatypeAware(),
            value = "a string";
        dt.setValue(value);
        this.assertEqual(value, dt.getValue());
        this.assert(this._xsdString.equals(dt.getDatatype()));
        this.assertFailInteger(dt);
        //assertFailInt(dt);
        this.assertFailFloat(dt);
        //assertFailLong(dt);
        //assertFailDecimal(dt);
    },

    testStringExplicit: function() {
        var dt = this.createDatatypeAware(),
            value = "a string";
        dt.setValue(value, this._xsdString);
        this.assertEqual(value, dt.getValue());
        this.assert(this._xsdString.equals(dt.getDatatype()));
        this.assertFailInteger(dt);
        //assertFailInt(dt);
        this.assertFailFloat(dt);
        //assertFailLong(dt);
        //assertFailDecimal(dt);
    },

    testURI: function() {
        var dt = this.createDatatypeAware(),
            iri = "http://www.example.org/",
            value = this.createLocator(iri);
        dt.setValue(value);
        this.assertEqual(iri, dt.getValue());
        this.assert(this._xsdAnyURI.equals(dt.getDatatype()));
        this.assert(value.equals(dt.locatorValue()));
        this.assertFailInteger(dt);
        //assertFailInt(dt);
        this.assertFailFloat(dt);
        //assertFailLong(dt);
        //assertFailDecimal(dt);
    },

    testURIExplicit: function() {
        var dt = this.createDatatypeAware(),
            iri = "http://www.example.org/",
            value = this.createLocator(iri);
        dt.setValue(iri, this._xsdAnyURI);
        this.assertEqual(iri, dt.getValue());
        this.assert(this._xsdAnyURI.equals(dt.getDatatype()));
        this.assert(value.equals(dt.locatorValue()));
        this.assertFailInteger(dt);
        //assertFailInt(dt);
        this.assertFailFloat(dt);
        //assertFailLong(dt);
        //assertFailDecimal(dt);
    },

    testInteger: function() {
        var value = 10,
            dt = this.createDatatypeAware(); 
        dt.setValue(value);
        this.assertEqual(value.toString(), dt.getValue());
        this.assert(this._xsdInteger.equals(dt.getDatatype()));
        this.assertEqual(value, dt.integerValue());
        //assertEquals(BigDecimal.TEN, dt.decimalValue());
        //assertEquals(10L, dt.longValue());
        //assertEquals(10, dt.intValue());
        this.assertIdentical(10.0, dt.floatValue());
    },

    testIntegerExplicit: function() {
        var value = 10,
            dt = this.createDatatypeAware();
        dt.setValue(value.toString(), this._xsdInteger);
        this.assertEqual(value.toString(), dt.getValue());
        this.assert(this._xsdInteger.equals(dt.getDatatype()));
        this.assertEqual(value, dt.integerValue());
        //assertEquals(BigDecimal.TEN, dt.decimalValue());
        //assertEquals(10L, dt.longValue());
        //assertEquals(10, dt.intValue());
        this.assertIdentical(10.0, dt.floatValue());
    },

    testUserDatatype: function() {
        var datatype = this.createLocator("http://www.example.org/datatype"),
            dt = this.createDatatypeAware(),
            value = "Value";
        dt.setValue(value, datatype);
        this.assertEqual(datatype, dt.getDatatype());
        this.assertEqual(value, dt.getValue());
        this.assertFailInteger(dt);
        //assertFailInt(dt);
        this.assertFailFloat(dt);
        //assertFailLong(dt);
        //assertFailDecimal(dt);
    },

    testIllegalDatatype: function() {
        var dt = this.createDatatypeAware();
        this.assertRaise('ModelConstraintException', function() {
            dt.setValue("value", null);
        }, "datatypeAware.setValue(\"value\", null) is illegal");
    },

    testIllegalStringValue: function() {
        var dt = this.createDatatypeAware();
        this.assertRaise('ModelConstraintException', function() {
            dt.setValue(null);
        }, "datatypeAware.setValue(null) is illegal");
    },

    testIllegalStringValueExplicit: function() {
        var dt = this.createDatatypeAware();
        this.assertRaise('ModelConstraintException', function() {
            dt.setValue(null, this._xsdString);
        }, "datatypeAware.setValue(null, datatype) is illegal");
    }

};
