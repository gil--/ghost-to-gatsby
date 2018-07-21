'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var TurndownService = require('turndown');

var turndownService = new TurndownService();

var _remark = require('remark');

var _remark2 = _interopRequireDefault(_remark);

var _imageDownloader = require('image-downloader');

var _imageDownloader2 = _interopRequireDefault(_imageDownloader);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _extractImages = require('./extract-images');

var _extractImages2 = _interopRequireDefault(_extractImages);

var extractImages = require("remark-extract-images");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mkdirAsync = (0, _util.promisify)(_fs2.default.mkdir);
const writeFileAsync = (0, _util.promisify)(_fs2.default.writeFile);

const getImagePath = imageUrl => {
  const parsed = _url2.default.parse(imageUrl);
  return _path2.default.basename(parsed.pathname || '');
};

const createPage = async ({ date, slug, title, tags, image, html, draft, featured, feature_image, author_id }, outputDirectory) => {
  const folderName = `${slug}`.toLowerCase().replace(/ /g, '-');

  const basePath = _path2.default.join(outputDirectory);
  const imagesPath = _path2.default.join(basePath, 'images');
  const markdownPath = _path2.default.join(basePath, `${slug}.md`);
  let markdown = turndownService.turndown(html).replace(new RegExp('/content/images/', 'g'), 'https://www.womaninrevolt.com/content/images/');
  let postImagePath;

  const ast = (0, _remark2.default)().parse(markdown);
  const images = (0, _extractImages2.default)(markdown);

  console.log(_chalk2.default.green(`Processing '${folderName}'`));

  try {
    await mkdirAsync(basePath);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }

  let uniqueImages = [...new Set(images.map(o => o.url).concat(image ? [image] : []))];

  uniqueImages.push(`https://www.womaninrevolt.com/${feature_image}`);

  const featuredImageArray = feature_image.split('/')
  const featuredImageNewPath = featuredImageArray[featuredImageArray.length - 1];

  const myimages = extractImages(ast);

  myimages.map(img => {
    if (img.url) {
      uniqueImages.push(img.url);
    }
    return true;
  });

  //console.log(uniqueImages);

  if (uniqueImages.length > 0) {
    try {
      await mkdirAsync(imagesPath);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }

  const imagesWithPaths = uniqueImages.map(o => ({
    url: o,
    path: getImagePath(o)
  }));

  const downloads = imagesWithPaths.map(({ url: imageUrl, path: originalImagePath }, index) => {
    let imagePath = originalImagePath;

    const occurrences = imagesWithPaths.slice(0, index).reduce((count, value) => count + (value.path === imagePath), 0);

    if (occurrences >= 1) {
      const extension = _path2.default.extname(imagePath);
      const filename = _path2.default.basename(imagePath, extension);
      imagePath = `${filename}-${occurrences}${extension}`;
    }

    if (image === imageUrl) {
      postImagePath = imagePath;
    }

    markdown = markdown.replace(new RegExp(imageUrl, 'g'), `./images/${imagePath}`);

    console.log(_chalk2.default.green(`Downloading '${imageUrl}'`));

    // return _imageDownloader2.default.image({
    //   url: imageUrl,
    //   dest: _path2.default.join(imagesPath, imagePath)
    // });
  });

  await Promise.all(downloads);

  let production = '';
  let author = '';
  let season = '';
  let episode = '';

  if (title.includes('Gilmore Girls')) {
    production = 'Gilmore Girls';
  } else if (title.includes('Top of the Lake')) {
    production = 'Top of the Lake';
  }

  if (author_id == 1) {
    author = 'Lindsay Pugh';
  }

  if (title.indexOf('Season', 0)) {
    season = title.substring(title.indexOf('Season', 7)).split(" ")[1];
    season = season.replace(':', '');
    season = season.replace(',', '');
    if (season.length > 2) {
      season = '';
    }
  }

  if (title.indexOf('Episode', 0)) {
    episode = title.substring(title.indexOf('Episode', 8)).split(" ")[1];
    episode = episode.replace(':', '');
    episode = episode.replace(',', '');

    if (episode.length > 2) {
      episode = '';
    }
  }

  if (tags.indexOf('Film')) {
    const titleSplit = title.split(" ");

    titleSplit.forEach((piece, index) => {
      if (piece.indexOf('(') >= 0 && piece.indexOf(')') >= 0) {
        air = piece.replace('(', '').replace(')', '');
      } else if ((piece.match(/'/g) || []).length == 2) {
        production = piece.replace("'", '').replace("'", '');
      } else if (piece.indexOf('by') >= 0) {
        director = `${titleSplit[index + 1]} ${titleSplit[index + 2]}`;
      }
    });

    console.log(air);
    console.log(production);
    console.log(director);
  }

  await writeFileAsync(markdownPath, `---
title: "${title}"
slug: "/${slug}"
date: "${date.toISOString()}"
featured: ${featured.toString()}
draft: ${draft.toString()}
tags: ${JSON.stringify(tags)}
feature_image: "./images/${featuredImageNewPath}"
production: "${production}"
season: "${season}"
episode: "${episode}"
director: "${director}"
air: "${air}"
author: "Lindsay Pugh"
---

${markdown}
`);
};

exports.default = createPage;
