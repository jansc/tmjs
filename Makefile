# tmjs makefile
#
# Based on the Makefile of jQuery (http://jquery.com) which is licensed
# under the MIT license.

SRC_DIR = src
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist
DOC_DIR = ${PREFIX}/doc

JSDOCDIR = ${BUILD_DIR}/jsdoc-toolkit

BASE_FILES = ${SRC_DIR}/tm-src.js

MODULES = ${SRC_DIR}/HEADER\
	${BASE_FILES}

TM = ${DIST_DIR}/tm.js
TM_MIN = ${DIST_DIR}/tm.min.js

TM_VER = `cat version.txt`
VER = sed s/@VERSION/${TM_VER}/

RHINO = ${JAVA_HOME}/bin/java -jar ${BUILD_DIR}/js.jar
MINJAR = ${JAVA_HOME}/bin/java -jar ${BUILD_DIR}/google-compiler-20091218.jar

DATE=`git log -1 | grep Date: | sed 's/[^:]*: *//'`

all: tmjs lint min
	@@echo "tm.js build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

init:
	@@echo "Grabbing external dependencies..."

tmjs: ${DIST_DIR} ${TM}
tm: ${DIST_DIR} ${TM}

${TM}: ${DIST_DIR} init ${MODULES}
	@@echo "Building" ${TM}

	@@mkdir -p ${DIST_DIR}
	@@mkdir -p ${DOC_DIR}

	@@cat ${MODULES} | \
		sed 's/Date:./&'"${DATE}"'/' | \
		${VER} > ${TM};

lint: ${TM}
	@@echo "Checking tm.js against JSLint..."
	@@${RHINO} build/jslint-check.js

min: ${TM_MIN}

doc: ${TM}
	@@echo "Building documentation"
	@@${JSDOCDIR}/jsrun.sh -d=${DOC_DIR} -t=${JSDOCDIR}/templates/jsdoc ${TM}


${TM_MIN}: ${TM}
	@@echo "Building" ${TM_MIN}

	@@head -4 ${TM} > ${TM_MIN}
	@@${MINJAR} --js ${TM} --warning_level QUIET >> ${TM_MIN}

clean:
	@@echo "Removing Distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}
	@@echo "Removing Documentation directory:" ${DOC_DIR}
	@@rm -rf ${DOC_DIR}
