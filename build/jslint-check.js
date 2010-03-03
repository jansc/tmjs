load("build/jslint.js");

var src = readFile("dist/tm.js");

JSLINT(src, { evil: true, forin: true });

var e = JSLINT.errors, found = 0, w, i;

for ( i = 0; i < e.length; i+=1 ) {
	w = e[i];

	found++;
	print( "\n" + w.evidence + "\n" );
	print( "    Problem at line " + w.line + " character " + w.character + ": " + w.reason );
}

if ( found > 0 ) {
	print( "\n" + found + " Error(s) found." );

} else {
	print( "JSLint check passed." );
}
