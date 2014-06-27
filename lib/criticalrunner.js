/*global phantom:true*/
/*global require:true*/
/*global window:true*/

/*
phantom args sent from critical.js:
	[0] - url
	[1] - filename
	[2] - width of page
	[3] - height of page
*/
(function(){
	"use strict";

	var site = phantom.args[0],
		filename = phantom.args[1],
		width = phantom.args[2],
		height = phantom.args[3];
		

	var system = require( "system" );

	var errorHandler = function(msg, trace) {
		var msgStack = ['PHANTOM ERROR: ' + msg];
		if (trace && trace.length) {
			msgStack.push('TRACE:');
			trace.forEach(function(t) {
				msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
			});
		}
		system.stderr.write( msgStack.join('\n') );
		phantom.exit(1);
	};


	var page = require( "webpage" ).create();
	var cc = require( "./criticalCSS" );

	phantom.onError = errorHandler;
	page.onError = errorHandler;


	page.viewportSize = {  width: width , height: height };

	page.open(  site, function( status ){
		if( status === "success" ){
			var stylesheets = page.evaluate(function(){
				return window.document.styleSheets;
			});

			var maxTop = page.evaluate(function(){
				return window.innerHeight;
			});

			var opts = {
				sheets: stylesheets,
				maxTop: maxTop,
				querySelector: function( selector ){
					return page.evaluate( function(s){
						return window.document.querySelector( s );
					}, selector );
				},
				matchMedia: function( query ){
					return page.evaluate( function(q){
						return window.matchMedia( q );
					}, query );
				}
			};

			var crit = cc.criticalCSS( filename, opts );
			if( crit.length === 0 ){
				throw new Error( "criticalCSS didn't run or no critical css, that seems unlikely" );
			} else {
				system.stdout.write(crit);
				phantom.exit();
			}
		} else {
			throw new Error( "Page didn't open: " + site );
		}
	});

}());