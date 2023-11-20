const { EleventyI18nPlugin } = require('@11ty/eleventy');
const { RetrieveGlobals } = require('node-retrieve-globals');
const { minify } = require('terser');
const { favicons } = require('favicons');
const { createHash } = require('crypto');
const sass = require('sass');
const toml = require('toml');
const coffee = require('coffeescript');
const fs = require('fs');
const path = require('path');

//
// Directories Setup
//
const root = path.sep;
const dot = '.'
const inputDir = 'src';
const outputDir = 'build';
const includesDir = '_includes';
const layoutsDir = '_layouts';
const assetsDir = 'assets'
const assetsPath = path.join(inputDir, assetsDir);
const imagesPath = path.join(assetsPath, 'images');

//
// Copy As-Is
//
var statics = {};
['images', 'fonts'].map(function(dir){
  statics[path.join(assetsPath, dir)] = path.join(root, assetsDir, dir);
});
statics[path.join(assetsPath, 'root')] = root;

//
// Language & Index Page Setup
//
const defaultLanguage = 'en';
const defaultLanguageURLRe = /^\/en\//;
const indexName = 'index';
const indexRegExFrom = /\/index\/index\./;
const indexRegExTo = '/index.';

//
// Favicon Setup
//
const faviconFile = path.join('src', 'assets', 'root', 'favicon.svg');
var faviconBuildInprogress = false;
var faviconSize = 0;
var faviconTags = '';

//
// {dir}_path Filter Setup
//
const path_filter_dirs = [ 'js', 'css', 'font' ];


module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: defaultLanguage,
    errorMode: 'strict',
  });
  eleventyConfig.addGlobalData('permalink', () => {
    return (data) => {
      var common = `${data.page.filePathStem}/${indexName}.${data.page.outputFileExtension}`;
      if (common.match(defaultLanguageURLRe)) {
        common = common.replace(defaultLanguageURLRe, '/');
      }
      common = common.replace(indexRegExFrom, indexRegExTo);
      return common;
    }
  });

  eleventyConfig.addUrlTransform(({url}) => {
    // Returning undefined skips the url transform.
  });

  //
  // assets helpers
  //
  eleventyConfig.addFilter('cssmin', function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter('sass', function(filename) {
    var res = sass.compile(path.join(dot, inputDir, filename), {
      style: 'compressed'
    })
    return res.css;
  });

  eleventyConfig.addFilter('jsmin', async function(code) {
    var result = await minify(code, { sourceMap: true });
    return result.code;
  });

  //
  // crypto helpers
  //
  eleventyConfig.addFilter('sha256', function(text) {
    return createHash('sha256').update(text).digest('hex');;
  });


  //
  // js_path, css_path, etc - Filters
  //
  path_filter_dirs.map(function(dir){
    eleventyConfig.addFilter(`${dir}_path`, async function(asset) {
      return `/${assetsDir}/${dir}/${asset}?${Date.now()}`;
    });
  });

  eleventyConfig.addFilter('favicon_tags', async function(params) {
    while(faviconBuildInprogress) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    faviconBuildInprogress = true;
    try {
      const size = fs.statSync(faviconFile).size;
      if (size == faviconSize) {
        faviconBuildInprogress = false;
        return faviconTags;
      }
      faviconSize = size;
      const response = await favicons(faviconFile, {});
      await Promise.all(response.images.map(async function(image){
        fs.writeFileSync(`${outputDir}/${image.name}`, image.contents);
      }));

      await Promise.all(response.files.map(async function(file){
        fs.writeFileSync(`${outputDir}/${file.name}`, file.contents);
      }));
      faviconTags = response.html.join('\n');
    } catch (error) {
      console.log(error.message);
    }
    faviconBuildInprogress = false;
    return faviconTags;
  });
  
  eleventyConfig.addWatchTarget(assetsPath);
  eleventyConfig.setNunjucksEnvironmentOptions({
    throwOnUndefined: true,
    autoescape: false, // warning: don’t do this!
  });
  eleventyConfig.setFrontMatterParsingOptions({
    engines: {
      toml: toml.parse.bind(toml),
      coffee: {
        parse: function(str, options) {
          /* eslint no-eval: 0 */
          return coffee['eval'](str, options);
        }
      },
      javascript: function(frontMatterCode) {
        let vm = new RetrieveGlobals(frontMatterCode);

        let data = {}; // want to pass in data available in front matter?
        return vm.getGlobalContext(data, {
          reuseGlobal: true,
          dynamicImport: true,
        });
      }
    }
  });

  eleventyConfig.addPassthroughCopy(statics);
  return {
    dir: {
      input: inputDir,
      output: outputDir,
      includes: includesDir,
      layouts: layoutsDir
    },
    htmlTemplateEngine: "njk"
  }
};
