# Introduction

`tmjs` is a Topic Maps engine written in pure JavaScript. It aims to be
compliant with the Topic Maps API [TMAPI 2.0](http://www.tmapi.org/2.0/)
and implements the Topic Maps - Data Model
[TMDM](http://www.isotopicmaps.org/sam/sam-model/).

`tmjs` is meant to be a lightweight engine that makes it possible to implement
Topic Maps based applications in Web browsers. It can be used to create
semantic mashups. The JavaScript library is independent of libraries such
as jQuery or prototype.js, but it can be used in combination with them.

For more details check out the [project's homepage]([http://github.com/jansc/tmjs).


# Features

* TMAPI 2.0-like API with an in-memory backend
* JTM 1.0 import/export (experimental)

See the file TODO for a list of missing features.


# Features to be implemented in the near future

* XTM 2.0 import/export (requires DOM)


# More planned features (feedback welcome)

* More import/export-formats
* TMRAP implementation
* SDshare implementation?
* More backends: HTML 5 Web SQL Database, persistent backend for node.js


# Dependencies

None. The code can be run together with jQuery, prototype.js and other
JavaScript libraries.

To build the library from the source code you need Java 1.6. The build
process checks the JavaScript with JSLint, creates a minified version of
the code and extracts API documentation from the source code. In addition,
you need the `make` utility. A `build.xml` file for `ant` is planned for a
future release.

To build the whole package run

    make

If you want to build the minified version of tm.js run

    make min

To run JSLint enter

    make lint

The API documentation can be build with

    make doc

To remove the files in the dist- and doc-directories run

    make clean


# Getting started

Include the file dist/tm.js or dist/tm.min.js into an (X)HTML page or a
JavaScript file (the last option applies to server-side JavaScript
implementations).

This is how to create a TopicMap object:

    var factory, sys, tmid, tm;
    factory = TopicMapSystemFactory.newInstance();
    factory.setProperty('com.semanticheadache.tmjs.backend', 'memory');
    sys = factory.newTopicMapSystem();
    tmid = sys.createLocator("http://example.org/mytm");
    tm = sys.createTopicMap(tmid);

By default newTopicMapSystem() returns an in-memory implementation.

See these topics for more information:

* [Getting started](http://wiki.github.com/jansc/tmjs/getting-started)
* [JTM import and export](http://wiki.github.com/jansc/tmjs/jtm-import-and-export)
* [Duplicate removal](http://wiki.github.com/jansc/tmjs/duplicate-removal)


# Distribution overview

Normally, you will only need the files in the dist- and doc-directory.
If you want to make changes to the source code, take a look at the
src-directory.

All other files are needed to build the distribution file, to minify
the source code and to run the unit tests.

* `build/*`     Software needed for the build process
* `src/*`       The source code of tm.js
* `test/*`      Unit tests

* `dist/*`      The final JavaScript-files (available after the build process)
* `doc/*`       The API documentation (available after the build process)


# Contact

For feedback or if you find any bugs or have comments or feature request
please use the issue tracker at

[project's homepage](http://github.com/jansc/tmjs)


# Copyright and License

`tmjs` has been written by Jan Schreiber (jans [at] ravn.no). It is licensed
under the MIT license. See the file MIT-LICENSE.txt for details.

