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
	, root = argv.root
	, cache = argv.cache
	, maxWidth = argv.maxWidth || 3000
	, maxHeight = argv.maxHeight || 3000
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

server.get('/image/:name/list.json', function (req, res, next) {
	//do a glob search for files for this name
	var path = join(root, req.params.name + '*.jpg');
	console.log(path);

	glob(path, function (err, files) {
		files.forEach(function (file, ix) {
			files[ix] = basename(file, '.jpg');
		});

		res.end(JSON.stringify(files));
	});
});

server.get('/image/:name-:width(\\d+)x:height(\\d+).:format', renderImage);
server.get('/image/:name.:format', renderImage); 

function renderImage (req, res, next) {
	var path = join(root, req.params.name + '.jpg');

	//limit max width/height
	req.params.width = Math.min(maxWidth, req.params.width);
	req.params.height = Math.min(maxHeight, req.params.height);

	var name = req.params.name + '-' + req.params.width + 'x' + req.params.height + '.' + req.params.format;
	var cached = join(cache, name);
	var crs = send(req, cached);

	crs.on('error', function (err) {
		readFresh();
	});

	crs.pipe(res);

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

				var rs = send(req, cached);

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
