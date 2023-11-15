const { EleventyI18nPlugin } = require("@11ty/eleventy");
const { RetrieveGlobals } = require("node-retrieve-globals");
const { minify } = require("terser");
const sass = require('sass');
const toml = require('toml');
const coffee = require('coffeescript');

const inputDir = "src";
const outputDir = "build";
const includesDir = "_includes";
const layoutsDir = "_layouts";

const defaultLanguage = "en";
const defaultLanguageURLRe = /^\/en\//;
const indexName = "index";
const indexRegExFrom = /\/index\/index\./;
const indexRegExTo = "/index.";

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    // any valid BCP 47-compatible language tag is supported
    defaultLanguage: defaultLanguage, // Required, this site uses "en"

    // When to throw errors for missing localized content files
    errorMode: "strict", // throw an error if content is missing at /en/slug
    // errorMode: "allow-fallback", // only throw an error when the content is missing at both /en/slug and /slug
    // errorMode: "never", // don’t throw errors for missing content
  });
  eleventyConfig.addGlobalData("permalink", () => {
    return (data) => {
      var common = `${data.page.filePathStem}/${indexName}.${data.page.outputFileExtension}`;
      if (common.match(defaultLanguageURLRe)) {
        common = common.replace(defaultLanguageURLRe, "/");
      }
      common = common.replace(indexRegExFrom, indexRegExTo);
      return common;
    }
  });
  eleventyConfig.addUrlTransform(({url}) => {
    // Returning undefined skips the url transform.
  });
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });
  eleventyConfig.addFilter("sass", function(filename) {
    return sass.compile(`./${inputDir}/${filename}`, {
      style: "compressed"
    }).css;
  });
  eleventyConfig.addFilter("jsmin", async function(code) {
    var result = await minify(code, { sourceMap: true });
    return result.code;
  });
  eleventyConfig.addFilter("js_path", async function(script_path) {
    return `/assets/js/${script_path}?${Date.now()}`;
  });
  eleventyConfig.addWatchTarget("./src/assets");
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
  eleventyConfig.addNunjucksShortcode("this", function() {
    return this;
  });
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
