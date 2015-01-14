#!/usr/bin/env node

var gm = require('gm')
	, fs = require('fs')
	, join = require('path').join
	, basename = require('path').basename
	, resolve = require('path').resolve
	, send = require('send')
	, argv = require('optimist').argv
	, useyHttp = require('usey-http')
	, server = useyHttp()
	, glob = require('glob')
	, port = process.env.PORT || argv.port || 5556
	, root = process.env.IMAGE_SERVE_ROOT || argv.root
	, cache = process.env.IMAGE_SERVE_CACHE || argv.cache
	, mount = process.env.IMAGE_SERVE_MOUNT || argv.mount || '/image'
	, maxWidth = process.env.IMAGE_SERVE_MAX_WIDTH || argv.maxWidth || 3000
	, maxHeight = process.env.IMAGE_SERVE_MAX_HEIGHT || argv.maxHeight || 3000
	, maxAge = process.env.IMAGE_SERVE_MAX_AGE || argv.maxAge
	;

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

//hanlde a route for name-widthxheight.format
server.get(mount + '/:name-:width(\\d+)x:height(\\d+).:format', renderImage);

//handle a route for full sized image
server.get(mount + '/:name.:format', renderImage); 

//This function will serve a cached image or render the new image, save it and send it
function renderImage (req, res, next) {
	var path = join(root, req.params.name + '.jpg')
		, name, cached
		;

	//limit max width/height
	req.params.width = Math.min(maxWidth, req.params.width);
	req.params.height = Math.min(maxHeight, req.params.height);

	fs.stat(path, function (err, stat) {
		if (err) {
			return next(err);
		}

		name = req.params.name + '-' + stat.mtime.getTime() + '-' + req.params.width + 'x' + req.params.height + '.' + req.params.format;
		cached = join(cache, name);

		var crs = send(req, cached, { maxAge : maxAge });

		crs.on('error', function (err) {
			readFresh();
		});

		crs.pipe(res);
	});


	function readFresh() {
		var rs = fs.createReadStream(path);

		rs.once('error', next);

		rs.once('readable', function () {
			var g = gm(rs, name)
				.options({ imageMagick : true })
				.trim()

			if (req.params.width && req.params.height) { 
				g.resize(req.params.width, req.params.height);
			}

			g.write(cached, function (err) {
				if (err) {
					return next(err);
				}

				var rs = send(req, cached, { maxAge : maxAge });

				rs.on('error', next);

				rs.pipe(res);
			});
		});
	};
};

server.use(useyHttp._404({ message : 'Image Not Found' }));

server.use('error', function (err, req, res) {
	res.end(err.stack);
});

server.listen(port);
console.log('listening on port %s', port);
