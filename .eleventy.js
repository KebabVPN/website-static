const { EleventyI18nPlugin } = require("@11ty/eleventy");

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
    if (url.match(defaultLanguageURLRe)) {
      // url = url.replace(defaultLanguageURLRe, "/asdas/");
      // console.log("url", url);
      // return url;
    }

    // Returning undefined skips the url transform.
  });
  return {
    dir: {
      input: "pages",
      output: "build"
    }
  }
};
