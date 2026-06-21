# 4.0.1 Release Checklist

## Automated checks

- [ ] `npm run build`
- [ ] `npm run check`
- [ ] `npm run smoke`
- [ ] GitHub Actions `Check` workflow passes on the release branch/tag.

## Local browser harness

- [ ] Open `npm run harness`.
- [ ] Verify all smoke checks in the harness are green.
- [ ] Verify animation on/off.
- [ ] Verify `bar_background_radius` and `bar_radius`.
- [ ] Verify the Shelly `custom:auto-entities` scenario.

## Live Home Assistant

- [ ] Install through HACS as custom repository type `Dashboard`.
- [ ] Confirm resource URL `/hacsfiles/bar-card-modernized/bar-card.js`.
- [ ] Test a single-entity card.
- [ ] Test a multi-entity card.
- [ ] Test a `custom:auto-entities` card.
- [ ] Test `tap_action`, `hold_action`, and `double_tap_action`.
- [ ] Test `perform-action`, `navigate`, `url`, and `assist` where practical.
- [ ] Test sections view with horizontal and vertical bars.
- [ ] Test mobile and desktop dashboard layouts.

## Release metadata

- [ ] Update README and CHANGELOG.
- [ ] Confirm `dist/bar-card.js` matches `src/bar-card.js`.
- [ ] Add GitHub topics: `home-assistant`, `homeassistant`, `lovelace`, `custom-card`, `hacs`, `dashboard`.
- [ ] Create the release tag.
- [ ] Attach `dist/bar-card.js` to the GitHub release.
