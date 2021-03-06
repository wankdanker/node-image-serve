#!/usr/bin/env node

var fs = require('fs'),
	join = require('path').join,
	basename = require('path').basename,
	resolve = require('path').resolve,
	argv = require('optimist').argv,
	useyHttp = require('usey-http'),
	server = useyHttp(),
	glob = require('glob'),
	rs = require('render-sender'),
	debug = require('debug')('image-server'),
	ParsedName = require('./lib/parsedName'),
	ml = require('./lib/avoid-leaks'),
	port = process.env.PORT || argv.port || 5556,
	root = process.env.IMAGE_SERVE_ROOT || argv.root,
	cache = process.env.IMAGE_SERVE_CACHE || argv.cache,
	mount = process.env.IMAGE_SERVE_MOUNT || argv.mount || '/image',
	maxWidth = process.env.IMAGE_SERVE_MAX_WIDTH || argv.maxWidth || 3000,
	maxHeight = process.env.IMAGE_SERVE_MAX_HEIGHT || argv.maxHeight || 3000,
	maxAge = process.env.IMAGE_SERVE_MAX_AGE || argv.maxAge,
	trim = process.env.IMAGE_SERVE_TRIM || argv.trim,
	minify = process.env.IMAGE_SERVE_MINIFY || argv.minify,
	background = process.env.IMAGE_SERVE_BACKGROUND || argv.background,
	square = process.env.IMAGE_SERVE_SQUARE || argv.square,
	bitrate = process.env.IMAGE_SERVE_BIT_RATE || argv.bitrate,
	framerate = process.env.IMAGE_SERVE_FRAME_RATE || argv.framerate,
	timestamp = process.env.IMAGE_SERVE_TIMESTAMP || argv.timestamp



if (!root) {
	console.error('--root is required to run');
	process.exit(1);
}

if (!cache) {
	console.error('--cache is required to run');
	process.exit(2);
}

root = resolve(root);
cache = resolve(cache);

var irs = rs({
	maxAge: maxAge,
	cache: cache
});

server.use(function (req, res, next) {
	debug(req.url);
	return next();
})

//handle a route that will do a glob search and retrieve matching available images
server.get(mount + '/:name/list.json', function (req, res, next) {
	//do a glob search for files for this name
	var path = join(root, req.params.name + '*.jpg');

	glob(path, function (err, files) {
		files.forEach(function (file, ix) {
			files[ix] = basename(file, '.jpg');
		});

		res.end(JSON.stringify(files));
	});
});

//handle the image route. options are parsed from the name of the file while
//still preserving the actual file name or at least trying to.
server.get(mount + '/:name', renderImage);

//a terrible default 404 handler
server.use(useyHttp._404({
	message: 'Image Not Found'
}));

//dump the stack and end when an error is caught
server.use('error', function (err, req, res, next) {
	if (err.code === 'ENOENT') {
		return useyHttp._404({
			message: 'Image Not Found'
		})(req, res);
	};

	res.status(500);

	res.json({
		error : {
			message : 'An internal error occurred while processing the image.'
		}
	});
});

//listen!
server.listen(port);

//say what port we're listing on, errrrr, on which port we are listening.
console.log('listening on port %s', port);

//This function will serve a cached image or render the new image, save it and send it
function renderImage(req, res, next) {
	var opts = new ParsedName(req.params.name);

	opts.path = join(root, opts.name);

	//limit max width/height
	opts.width = Math.min(maxWidth, opts.width);
	opts.height = Math.min(maxHeight, opts.height);

	opts.trim = (opts.trim != null) ? opts.trim : trim;
	opts.minify = (opts.minify != null) ? opts.minify : minify;
	opts.background = (opts.background != null) ? opts.background : background;
	opts.square = (opts.square != null) ? opts.square : square;
	
	//Video opts.

	opts.bitrate = (opts.bitrate != null) ? opts.bitrate : bitrate;
	opts.framerate = (opts.framerate != null) ? opts.framerate : framerate;
	opts.timestamp = (opts.timestamp != null) ? opts.timestamp : timestamp;

	debug(opts);

	opts.req = req;
	opts.res = res;

	irs(opts, function (err) {
		if (err) {
			console.error(err);
			
			return next(err);
		}

		//else the reponse already was ended by render-sender
	});
};

