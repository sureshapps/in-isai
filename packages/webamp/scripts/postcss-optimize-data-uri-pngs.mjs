import dataUriToBuffer from "data-uri-to-buffer";
import imagemin from "imagemin";
import imageminOptipng from "imagemin-optipng";

const DATA_URL_REGEX = new RegExp(/url\((data:image\/png;base64,.+)\)/gi);
const DATA_URL_PROPS_REGEX = /^(background(?:-image)?)|(content)|(cursor)/;

async function optimizeDataUri(dataUri) {
  const buffer = dataUriToBuffer(dataUri);
  const optimized = await imagemin.buffer(buffer, {
    use: [imageminOptipng()],
  });
  return `data:image/png;base64,${optimized.toString("base64")}`;
}

const plugin = () => {
  return {
    postcssPlugin: "postcss-optimize-data-uri-pngs",
    async Once(css) {
      // walkDecls does not let us work async, so we collect the async work we
      // need to do here, and await it at the end
      const promisesFactories = [];
      css.walkDecls(DATA_URL_PROPS_REGEX, (decl) => {
        let matches;
        // WTF JavaScript. This is the worst API for iterating RegEx matches.
        while ((matches = DATA_URL_REGEX.exec(decl.value))) {
          const [, dataUri] = matches;
          promisesFactories.push(async () => {
            decl.value = decl.value.replace(
              dataUri,
              await optimizeDataUri(dataUri)
            );
          });
        }
      });
      await Promise.all(promisesFactories.map((p) => p()));
    },
  };
};

plugin.postcss = true;

export default plugin;
