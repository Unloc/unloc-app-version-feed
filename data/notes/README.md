# Editorial overlay

Drop a Markdown file here to replace the store-fetched release notes for a specific version. The renderer prefers your text over what the App Store or Play Store provides.

## File naming

```
<platform>-<version>.md
```

- Platform is `ios` or `android`
- Version is the exact version string the stores report (e.g. `5.11.2`, `5.7.7`)

Examples: `ios-5.11.2.md`, `android-5.7.7.md`.

## File format

One section per locale, headed with `# <locale-code>`. Supported codes: `en`, `no`, `sv`, `da`.

```markdown
# en
- Added support for FaceID on the lock screen
- Fixed a rotation bug on iPad

# no
- La til støtte for FaceID på låseskjermen
- Fikset en rotasjonsfeil på iPad
```

## Rules

- Per-locale opt-in. If a locale section is absent, that locale falls back to the store-provided text (or the localized "no release notes" fallback).
- Plain text only — line breaks are preserved, HTML is escaped. Markdown formatting is not interpreted in v1.
- Files with unknown filenames or no recognized sections are ignored silently.
- The override is applied at render time. `data/versions.json` (the durable history) still contains the original store text.

## When to use this

- The Play Store "What's new" field is empty for an Android release.
- The App Store note is generic ("Bug fixes and minor improvements") but a specific customer-facing change is worth calling out.
- A release ships in one store before the other, and you want the entry to read consistently.
