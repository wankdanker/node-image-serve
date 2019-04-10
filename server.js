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
	port = process.env.PORT || argv.port || 5556,
	root = process.env.IMAGE_SERVE_ROOT || argv.root,
	cache = process.env.IMAGE_SERVE_CACHE || argv.cache,
	mount = process.env.IMAGE_SERVE_MOUNT || argv.mount || '/image',
	maxWidth = process.env.IMAGE_SERVE_MAX_WIDTH || argv.maxWidth || 3000,
	maxHeight = process.env.IMAGE_SERVE_MAX_HEIGHT || argv.maxHeight || 3000,
	maxAge = process.env.IMAGE_SERVE_MAX_AGE || argv.maxAge,
	trim = process.env.IMAGE_SERVE_TRIM || argv.trim,
	minify = process.env.IMAGE_SERVE_MINIFY || argv.minify,
	bitrate = process.env.BIT_RATE || argv.bitrate,
	framerate = process.env.FRAME_RATE || argv.framerate,
	timestamp = process.env.TIMESTAMP || argv.timestamp,
	size = process.env.SIZE || argv.size;


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
		useyHttp._404({
			message: 'Image Not Found'
		})(req, res);
	};

	res.end(err.stack);
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

	//Video opts.

	opts.bitrate = (opts.bitrate != null) ? opts.bitrate : bitrate;
	opts.framerate = (opts.framerate != null) ? opts.framerate : framerate;
	opts.timestamp = (opts.timestamp != null) ? opts.timestamp : timestamp;
	opts.size = (opts.size != null) ? opts.size : size;

	debug(opts);

	opts.req = req;
	opts.res = res;

	irs(opts, function (err) {
		if (err) {
			debug(err)
			return next(err);
		}
	});
};

ParsedName.OPTIONS = {
	dimensions: /-(([0-9]+)x([0-9]+))/,
	crop: /-(cropped|crop):([0-9]+)x([0-9]+)~([0-9]+),([0-9]+)/,
	trim: /-trimmed|-trim/,
	notrim: /-notrim|-nottrimmed/,
	minify: /-minify|-minified/,
	nominify: /-nominify|-notminified/,
	format: /\.([a-zA-Z0-9]+)$/,
	sourceFormat: /\.([a-zA-Z0-9]+)\.[a-zA-Z0-9]+$/,
	bitrate: /-bitrate:([0-9]{1,4})/,
	framerate: /-framerate:([0-9]{1,3})/,
	timestamp: /-timestamp:([0-9]{1,9})/,
	size : /-size:([0-9]{1,4}x[0-9]{1,4})/

};

function ParsedName(name) {
	var fileName = [];
	var foundOptions = false;

	name.split(/-/gi).forEach(function (token, i, a) {
		debug(token)
		if (foundOptions) {
			return;
		}

		//see if this token matches any of the options that we will parse
		var matchedOpts = Object.keys(ParsedName.OPTIONS).filter(function (key) {
			if (key === 'format' || key === 'sourceFormat') {
				return false;
			}
			return ParsedName.OPTIONS[key].test('-' + token);
		});

		if (matchedOpts.length) {
			foundOptions = true;

			return;
		}

		if (i == a.length - 1) {
			fileName.push(token.split('.')[0]);
		} else {
			fileName.push(token);
		}
	});

	var dimensions = ParsedName.OPTIONS.dimensions.exec(name);
	var crop = ParsedName.OPTIONS.crop.exec(name);

	this.sourceFormat = (ParsedName.OPTIONS.sourceFormat.exec(name) || "")[1] || null;
	this.format = (ParsedName.OPTIONS.format.exec(name) || "")[1] || null;
	this.sourceFormat = this.sourceFormat || this.format;

	this.name = fileName.join('-') + '.' + (this.sourceFormat || this.format || 'mp4');

	this.bitrate = (ParsedName.OPTIONS.bitrate.exec(name) || "")[1] || null;
	this.framerate = (ParsedName.OPTIONS.framerate.exec(name) || "")[1] || null;
	this.timestamp = (ParsedName.OPTIONS.timestamp.exec(name) || "")[1] || null;
	this.size = (ParsedName.OPTIONS.size.exec(name) || "")[1] || null;

	this.trim = ParsedName.OPTIONS.trim.test(name) ?
		true :
		ParsedName.OPTIONS.notrim.test(name) ?
		false :
		null;

	this.minify = ParsedName.OPTIONS.minify.test(name) ?
		true :
		ParsedName.OPTIONS.nominify.test(name) ?
		false :
		null;

	if (dimensions) {
		this.dimensions = dimensions[1];
		this.width = dimensions[2];
		this.height = dimensions[3];
	} else {
		this.dimensions = null;
		this.width = null;
		this.height = null;
	}

	if (crop) {
		this.crop = {
			width: crop[2],
			height: crop[3],
			x: crop[4],
			y: crop[5]
		};
	} else {
		this.crop = null;
	}
}