# Server guidelines

## API error messages: always add AND localize

Every user-facing error message must exist in two places, kept in sync:

1. `messages.js` — the English constant that code throws
   (`throw new Error(SOME_MESSAGE)`).
2. `utils/lang-messages.js` — an entry keyed by the **exact** English string,
   with a stable numeric `code` and translations for **all** supported
   languages (en, de, es, fa, fr, id, it, ja, ko, mn, nl, pt, ru, tr, ur, vi,
   zh).

A message missing from `lang-messages.js` reaches the client untranslated and
**without a `code`**, which forces clients into fragile string-matching on
message text.

Rules:

- Codes are append-only and permanent: never change or reuse an existing code.
  Static messages take the next unused code at the end of the `messages`
  object (before the `// add new ones above here` marker); parameterized
  `functionMessages` entries get an explicit `.code` assignment (1000+ range).
- The `lang-messages.js` key must match the `messages.js` string
  character-for-character, or lookup silently fails.
- Controllers must send errors through
  `errorMessageConverter(err, req?.auth?.sub?.lang)` and return
  `{ message: messageObj?.message, lang: messageObj?.lang, code: messageObj?.code }` —
  never raw `err.message`.
- Clients (web/mobile) must branch on the numeric `code`, never on message
  text — the text is localized to the user's language.
- `messages.js` and `utils/lang-messages.js` are shared verbatim between
  `hollaex-server` and `hollaex-kit/server` because both serve the same web
  front-end, which relies on exact codes. When adding a message in one repo,
  add the identical entry (same string, same code) to the other in the same
  change — codes are append-only across **both** repos.
