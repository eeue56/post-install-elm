# post-install-elm
Use NPM for managing elm deps


## Install

```
npm install --save post-install-elm
```

## How to use

This package is intendend to enable you to use npm to host your Elm packages. It works by downloading an Elm package from github when passed in.

Add this script as a post install script to your npm package, with the desired package and version.

```javascript

install("https://github.com/eeue56/elm-ffi", "1.0.0").then( () => {
	console.log('Installed!')
}).catch((err) => {
	console.error("Something went wrong when installing!");
	console.error(err);
});
```