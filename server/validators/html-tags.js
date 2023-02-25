const { parse } = require("node-html-parser");

const isCorrectHtmlTags = async (str) => {
  // const regex = /<\/?[\w\d]+(.*?)>/gi;

  const regex = /<(.*?)>/gi; // for extracting tags

  const aRegOpen = /<a href="(.*?)" title="(.*?)"+>/g;
  const aRegClose = /<\/a>/g;
  const strongRegOpen = /<strong>/g;
  const strongRegClose = /<\/strong>/g;
  const iRegOpen = /<i>/g;
  const iRegClose = /<\/i>/g;
  const codeRegOpen = /<code>/g;
  const codeRegClose = /<\/code>/g;

  const tags = str.match(regex);

  if (!tags) return true;

  if (tags.length % 2 !== 0) {
    return false;
  }

  // Weeding out only allowed tags: a, code, i, strong
  const matches = tags.map((tag) => {
    if (
      tag.match(aRegOpen) ||
      tag.match(aRegClose) ||
      tag.match(strongRegOpen) ||
      tag.match(strongRegClose) ||
      tag.match(iRegOpen) ||
      tag.match(iRegClose) ||
      tag.match(codeRegOpen) ||
      tag.match(codeRegClose)
    ) {
      return true;
    }
    return false;
  });

  if (matches.some((m) => m === false)) return false;

  const isCorrectOpenClose = async () => {
    const root = parse(str);

    const comparedValue = root.toString().localeCompare(str, "en", {
      sensitivity: "base",
    });
    if (comparedValue === 0) return true;
    return false;
  };

  const isCorrect = await isCorrectOpenClose();

  return isCorrect;
};

module.exports = {
  isCorrectHtmlTags,
};
