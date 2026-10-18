const CODE_MARK = String.fromCharCode(0);
const CODE_PLACEHOLDER = new RegExp(`${CODE_MARK}(\\d+)${CODE_MARK}`, "g");

// A fenced code block of either kind. A backtick block runs from one run of
// three backticks to the next, as it always has. A tilde block follows the same
// rule `extractSections` uses: it opens on a line of three or more `~` (at most
// three spaces in, anything after them) and closes on a line of the same
// character at least as long with nothing after it, or at the end of the text
// when it never closes. Both are matched in one pass so whichever opens first
// swallows any fence-like line inside it.
const FENCED_BLOCK =
  /```[\s\S]*?```|^ {0,3}(~{3,})[^\n]*[\s\S]*?(?:\n {0,3}\1~*[ \t\r]*$|(?![\s\S]))/gm;

// Emphasis: `*` as before. `_` only where the underscores stand apart from the
// word around them, because CommonMark has no emphasis with `_` inside a word
// and a name like OPENAI_API_KEY written as plain text would lose them. Each
// side must be a whole run of underscores, so the closer cannot be the tail of
// a longer run such as the second half of `__init__`.
const EMPHASIS =
  /(\*{1,3})(.*?)\1|(?<![\p{L}\p{N}_])(_{1,3})(.*?)(?<!_)\3(?![\p{L}\p{N}_])/gu;

/**
 * Strips Markdown syntax from a page or a section to get the plain text the
 * search index stores.
 *
 * Inline code keeps its text, because commands, environment variables and API
 * names are what people search for. Fenced code blocks go: they hold
 * placeholder keys and tokens that do not belong in a served index. A block
 * fenced with backticks and one fenced with `~~~` are both dropped, and an
 * underscore inside a word (`OPENAI_API_KEY` written as plain text) is never
 * read as emphasis, as in CommonMark.
 *
 * Kept free of dependencies, like headingId.js and truncate.js, so a test can
 * load it without the docs site's packages and feed it inputs no docs page
 * contains.
 *
 * @param {string} content Markdown source
 * @returns {string} plain text
 */
function stripMarkdown(content) {
  // Inline code holds exactly what people search for — commands, env vars, API
  // names — so its text is kept. It is parked behind a placeholder until the
  // end because the passes below would damage it: the tag pass drops `<file>`
  // and the emphasis pass collapses `OPENAI_API_KEY` to "OPENAIAPIKEY". The
  // placeholder is an index between NUL characters: none of those passes
  // matches NUL, and Markdown source never contains it, so document text
  // cannot be mistaken for a placeholder on restore.
  const codeSpans = [];
  let result = content
    // Remove code blocks
    .replace(FENCED_BLOCK, "")
    .replace(
      /`([^`]*)`/g,
      (_, code) => `${CODE_MARK}${codeSpans.push(code) - 1}${CODE_MARK}`,
    )
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1");

  // Iteratively strip HTML tags to handle nested/malformed tags
  let prev;
  do {
    prev = result;
    result = result.replace(/<[^>]*>/g, "");
  } while (result !== prev);

  return (
    result
      // Remove headings markers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(
        EMPHASIS,
        (_match, _stars, starred, _underscores, underscored) =>
          starred ?? underscored,
      )
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Remove MDX imports/exports
      .replace(/^(import|export)\s+.*$/gm, "")
      // Remove admonitions
      .replace(/^:::.*$/gm, "")
      // Collapse whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(CODE_PLACEHOLDER, (_, i) => codeSpans[Number(i)])
      .trim()
  );
}

module.exports = { stripMarkdown };
