'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _createPage = require('./create-page');

var _createPage2 = _interopRequireDefault(_createPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createPages = async (filePath, outputDirectory) => {
  console.log(_chalk2.default.green(`reading file '${filePath}'`));
  const contents = _fs2.default.readFileSync(filePath, 'utf8');

  console.log(_chalk2.default.green('parsing...'));
  const root = JSON.parse(contents);

  const dbs = root.db;

  if (dbs.length !== 1) {
    throw new Error('Only 1 db is supported');
  }

  const db = dbs[0];
  const { data } = db;

  console.log(_chalk2.default.green(`${data.posts.length} posts found`));

  const posts = data.posts.map(({ title, slug, image, html, published_at, id, status, featured, feature_image, author_id }) => {
    const postTags = data.posts_tags.filter(o => o.post_id === id).sort((a, b) => a.sort_order - b.sort_order).map(o => o.tag_id);

    const tags = data.tags.filter(o => postTags.includes(o.id)).map(o => o.name);

    return {
      slug,
      date: (0, _moment2.default)(published_at),
      title,
      image,
      html,
      tags,
      draft: status !== 'published',
      featured: featured === 1,
      feature_image,
      author_id
    };
  });

  const pages = posts.map(post => (0, _createPage2.default)(post, outputDirectory));

  await Promise.all(pages);

  console.log(_chalk2.default.green('Done'));
};

exports.default = createPages;
