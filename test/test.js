const test = require('tape');
const parsedName = require('../lib/parsedName');

//Write unit tests for parsedName.js

test("Testing parsedName dimensions", t => {

    const dimensions = '500x500'
    const testFileName = 'image1-' + dimensions
    const opts = new parsedName(testFileName);
    t.equal(opts.dimensions, dimensions, "dimensions should be equal.");
    t.end();
});

test("Testing parsedName crop", t => {
    
    const crop = {
        width : '250'
        , height: '250'
        , x: '2'
        , y: '2'
    }

    //Testing crop.
    const testFileName = 'image1-crop:' + crop.width+ "x" + crop.height + '~' + crop.x + "," + crop.y + '.jpg';
    const opts = new parsedName(testFileName);
    t.deepEqual(opts.crop, crop, "crop should be equal.");

    //Testing cropped.
    const testFileName2 = 'image1-cropped:' + crop.width+ "x" + crop.height + '~' + crop.x + "," + crop.y + '.jpg';
    const opts2 = new parsedName(testFileName2);
    t.deepEqual(opts2.crop, crop, "cropped should be equal.");

    t.end();
});

test("Testing parsedName crop with decimals", t => {
    
    const crop = {
        width : '0.567'
        , height: '.896'
        , x: '0.25'
        , y: '.35'
    }

    //Testing crop.
    const testFileName = 'image1-crop:' + crop.width+ "x" + crop.height + '~' + crop.x + "," + crop.y + '.jpg';
    const opts = new parsedName(testFileName);
    t.deepEqual(opts.crop, crop, "crop should be equal.");

    //Testing cropped.
    const testFileName2 = 'image1-cropped:' + crop.width+ "x" + crop.height + '~' + crop.x + "," + crop.y + '.jpg';
    const opts2 = new parsedName(testFileName2);
    t.deepEqual(opts2.crop, crop, "cropped should be equal.");

    t.end();
});

test("Testing parsedName trim", t => {

    //Testing trim.
    const testFileName = 'image1-trim.jpg'
    const opts = new parsedName(testFileName);
    t.equal(opts.trim, true, "trim should be equal.");

    //Testing trimmed.
    const testFileName2 = 'image1-trimmed.jpg'
    const opts2 = new parsedName(testFileName2);
    t.equal(opts.trim, true), "trimmed should be equal.";

    t.end();
});

test("Testing parsedName notrim", t => {

    //Testing notrim.
    const testFileName = 'image1-notrim.jpg'
    const opts = new parsedName(testFileName);
    t.equal(opts.trim, false, "notrim should be equal.");

    //Testing nottrimmed.
    const testFileName2 = 'image1-nottrimmed.jpg'
    const opts2 = new parsedName(testFileName2);
    t.equal(opts.trim, false, "nottrimmed should be equal");

    t.end();
});

test("Testing parsedName minify", t => {

    //Testing minify.
    const testFileName = 'image1-minify.jpg'
    const opts = new parsedName(testFileName);
    t.equal(opts.minify, true, "minify should be equal.");

    //Testing minifed.
    const testFileName2 = 'image1-minified.jpg'
    const opts2 = new parsedName(testFileName2);
    t.equal(opts.minify, true, "minified should be equal.");
   
    t.end();
});

test("Testing parsedName nominify", t => {

    //Testing nominify.
    const testFileName = 'image1-nominify.jpg'
    const opts = new parsedName(testFileName);
    t.equal(opts.minify, false, "nominify should be equal.");

    //Testing nominifed.
    const testFileName2 = 'image1-nominified.jpg'
    const opts2 = new parsedName(testFileName2);
    t.equal(opts.minify, false, "nominifed should be equal.");
    
    t.end();
});
test("Testing parsedName format", t => {

    //Testing format.
    const format = 'jpg'
    const testFileName = 'image1.' + format;
    const opts = new parsedName(testFileName);
    t.equal(opts.format, format, "format should be equal.");

    t.end();
});

test("Testing parsedName sourceFormat", t => {

    //Testing source format.
    const sourceFormat = "mp4";
    const testFileName = 'image1.' + sourceFormat + '.jpg';
    const opts = new parsedName(testFileName);
    t.equal(opts.sourceFormat, sourceFormat, "source format should be equal.");

    t.end();
});
test("Testing parsedName bitrate", t => {

    //Testing bitrate.
    const bitrate = '2000';
    const testFileName = 'image1-bitrate:' + bitrate + '.mp4'
    const opts = new parsedName(testFileName);
    t.equal(opts.bitrate, bitrate, "bitrate should be equal.")

    t.end();
});

test("Testing parsedName framerate", t => {

    //Testing framerate;
    const framerate = '60.';
    const testFileName = 'image1-framerate:' + framerate + '.mp4';
    const opts = new parsedName(testFileName);
    t.equal(opts.framerate, framerate, "framerate should be equal.")

    t.end();
});

test("Testing parsedName timestamp", t => {

    //Testing timestamp.
    const timestamp = '5';
    const testFileName = 'image1-timestamp:' + timestamp + '.mp4';
    const opts = new parsedName(testFileName);
    t.equal(opts.timestamp, timestamp, "timestamp should be equal.")

    t.end();
});

test("Testing parsedName size", t => {

    //Testing size.
    const size = '200x200'
    const testFileName = 'image1-size:' + size + '.jpg';
    const opts = new parsedName(testFileName);
    t.equal(opts.size, size, "size should be equal.")

    t.end();
});

test("Testing parsedName multiple attrbutes", t => {

    //Testing multiple attributes.
    const bitrate = '3000';
    const framerate = '60';
    const dimensions = '500x500';
    const sourceFormat = 'mp4';

    const testFileName = 'video-' + dimensions + '-framerate:' + framerate + '-bitrate:' + bitrate + '-trimmed' + '-minify' + '.' + sourceFormat;
    const opts = new parsedName(testFileName);
    t.equal(opts.dimensions, dimensions, "dimensions should be equal.");
    t.equal(opts.bitrate, bitrate, "bitrate should be equal.");
    t.equal(opts.framerate, framerate, "framerate should be equal.");
    t.equal(opts.sourceFormat, sourceFormat, "sourceFormat should be equal.");

    t.end();
});


test("Testing parsedName square with white background", t => {
    const opts = new parsedName('image-100x100-trim-square-background:white.jpg');

    t.equal(opts.background, 'white', 'background is white');
    t.equal(opts.trim, true, 'trim is true');
    t.equal(opts.square, true, 'square is true');

    t.end();
});

test("Testing parsedName sharpen", t => {
    const opts = new parsedName('image-100x100-sharpen:5.jpg');

    t.equal(opts.sharpen, '5', 'sharpen value 5');

    t.end();
});