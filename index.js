#!/usr/bin/env node

const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');
const ghdownload = require('github-download');
const request = require('request');
const remove = require("remove");



const downloadZipball = (package, packageName, version) => {
	return new Promise(function(resolve, reject){
		const user = packageName.split("/")[0];
		const name = packageName.split("/")[1];
		const almostPlace = path.join("elm-stuff", "packages", packageName);
		const place = path.join("elm-stuff", "packages", packageName, version);

		var inZipping = false;
		console.log('Installing', packageName, "at", version);

		ghdownload(
			{user: user, repo:name, ref:version}, 
			place
		).on('error', function(err) {
		})
		.on('end', function() {
			console.log('ended');
			if (!inZipping){
				resolve();
			}
		})
		.on('zip', function(zipUrl) { 
			inZipping = true;
			request(zipUrl)
			  	.pipe(fs.createWriteStream('_download.zip'))
			  	.on('close', function () {
		  	   		const zip = new AdmZip("_download.zip");
		  	   		const firstFolder = zip.getEntries()[0].entryName;
		  	   		try {
			  	   		remove.removeSync(almostPlace + "/" + firstFolder);
			  	   	} catch (e) {}
			  	   	try {
			  	   		remove.removeSync(place);
			  	   	} catch (e) {}

		  	   		zip.extractAllTo(almostPlace, true);
		  	   		fs.renameSync(almostPlace + "/" + firstFolder, place);

		  	   		remove.removeSync("_download.zip");
 					resolve();
			  	});


		});
	});
};

const addToExactDependencies = (packageName, version) => {
	return new Promise((resolve, reject) => {
		console.log('Adding to exact deps..');
		const exactPath = path.join(process.cwd(), "elm-stuff", "exact-dependencies.json");
		var exactDeps = {}; 

		try {
			exactDeps = require(exactPath);
		} catch(e){

		}

		exactDeps[packageName] = version;

		fs.writeFile(exactPath, JSON.stringify(exactDeps, null, 4), function(err, succ){
			if (err) return reject();
			resolve();
		});

	});
};

const getUserHome = () => {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};


const copyElmPackage = (packageName, version) => {
	return new Promise((resolve, reject) => {
		console.log("copy elm package");
		const elmPackagePath = path.join(process.cwd(), "elm-stuff/packages", packageName, version, "elm-package.json");
		const currentElmPackage = require(elmPackagePath);

		var elmMajorVersion = currentElmPackage["elm-version"].split(" ")[0];
		elmMajorVersion = elmMajorVersion.substr(0, elmMajorVersion.lastIndexOf('.'));
		elmMajorVersion += '.0';

		const packageLocation = path.join(getUserHome(), "/.elm/", elmMajorVersion, "package" , packageName, version, 'elm-package.json');

		fsExtra.ensureFileSync(packageLocation);
		fs.writeFileSync(packageLocation, JSON.stringify(currentElmPackage, null, 4));
		resolve();
	});
};

const addToElmPackage = (packageName, version) => {
	return new Promise((resolve, reject) => {
		const elmPackagePath = path.join(process.cwd(), "elm-package.json");
		const elmPackage = require(elmPackagePath);

		elmPackage["dependencies"][packageName] = version + " <= v <= " + version;
		fs.writeFileSync(elmPackagePath, JSON.stringify(elmPackage, null, 4));
	});
};

const install = (package, version) => {
	const parts = package.split('/');
	const packageName = parts.slice(parts.length - 2).join("/");

	return new Promise(function(resolve){
		downloadZipball(package, packageName, version)
			.then(addToExactDependencies(packageName, version))
			.then(copyElmPackage(packageName, version))
			.then(addToElmPackage(packageName, version))
			.then(resolve);
	});
};

module.exports = {
	install: install
}