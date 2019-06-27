module.exports = ParsedName;

ParsedName.OPTIONS = {
	dimensions: /-(([0-9]+)x([0-9]+))/,
	size: /-size:(([0-9]+)x([0-9]+))/,
	crop: /-(cropped|crop):([0-9]+)x([0-9]+)~([0-9]+),([0-9]+)/,
	trim: /-trimmed|-trim/,
	notrim: /-notrim|-nottrimmed/,
	minify: /-minify|-minified/,
	nominify: /-nominify|-notminified/,
	format: /\.([a-zA-Z0-9]+)$/,
	sourceFormat: /\.([a-zA-Z0-9]+)\.[a-zA-Z0-9]+$/,
	bitrate: /-bitrate:([0-9]{1,4})/,
	framerate: /-framerate:([0-9\.]{1,3})/,
	timestamp: /-timestamp:([0-9]{1,9})/
};

function ParsedName(name) {
	var fileName = [];
	var foundOptions = false;

	name.split(/-/gi).forEach(function (token, i, a) {
		//debug(token)
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
	var size = ParsedName.OPTIONS.size.exec(name);
	var crop = ParsedName.OPTIONS.crop.exec(name);

	this.sourceFormat = (ParsedName.OPTIONS.sourceFormat.exec(name) || "")[1] || null;
	this.format = (ParsedName.OPTIONS.format.exec(name) || "")[1] || null;
	this.sourceFormat = this.sourceFormat || this.format;

	this.name = fileName.join('-') + '.' + (this.sourceFormat || this.format || 'mp4');

	this.bitrate = (ParsedName.OPTIONS.bitrate.exec(name) || "")[1] || null;
	this.framerate = (ParsedName.OPTIONS.framerate.exec(name) || "")[1] || null;
	this.timestamp = (ParsedName.OPTIONS.timestamp.exec(name) || "")[1] || null;

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

	if (size) {
		this.size = size[1];
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