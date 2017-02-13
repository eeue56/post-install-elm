#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const urlPackage = require('url');


const downloadZipball = (package, version) => {
	const file = fs.createWriteStream("download.zip");
	const url = urlPackage.resolve(package, "zipball", version);
	console.log(url);
	const request = https.get(url, function(response) {
	  response.pipe(file);
	});
};

const install = (package, version) => {
	downloadZipball(package, version);
};

module.exports = {
	install: install
}

install("https://github.com/eeue56/elm-ffi", "1.0.0");