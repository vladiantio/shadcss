# Releasing

`loseta` is published to npm from the **Publish** workflow
(`.github/workflows/publish.yml`) when a GitHub release is published. The
workflow validates the registry, checks that the release tag matches the package
version, and publishes `packages/loseta` with provenance through npm trusted
publishing.

## Trusted publishing

`loseta` is bound to `.github/workflows/publish.yml` in `vladiantio/loseta` with
**Allow npm publish** enabled. GitHub Actions obtains a short-lived OIDC token
and npm verifies the workflow and repository before accepting the publish; no
npm token secret is required.

If the binding has to be recreated:

```bash
npm login
npm trust github loseta \
  --file publish.yml \
  --repo vladiantio/loseta \
  --allow-publish \
  --yes
```

`npm trust` requires npm 11.15 or later and an account with 2FA enabled. You can
also configure it in the package settings on npmjs.com and select **Allow npm
publish**.

A new trusted publisher must complete its first successful publish within two
days, or it expires and must be recreated. Configure it when you are ready to
ship the next version, not months in advance.

Keep the package's **Publishing access** set to **Require two-factor
authentication and disallow tokens**. The workflow authenticates through OIDC,
not through a repository secret.

## Subsequent releases

1. Bump `packages/loseta/package.json` and add a `CHANGELOG.md` section.
2. Run the full gate and regenerate artifacts if needed:

   ```bash
   pnpm test
   pnpm registry:examples
   pnpm docs:css
   git diff --exit-code web/src/styles/loseta.css packages/loseta/registry
   ```

3. Commit, tag and push:

   ```bash
   git commit -am "chore(release): 0.2.0"
   git tag -a v0.2.0 -m "loseta 0.2.0"
   git push origin main
   git push origin v0.2.0
   ```

4. Publish the GitHub release:

   ```bash
   gh release create v0.2.0 --title "loseta 0.2.0" --generate-notes
   ```

5. Watch the **Publish** workflow and verify the result:

   ```bash
   npm view loseta version
   npx loseta --help
   ```

The workflow skips publishing when the version already exists, so a re-run after
a partial failure is safe.
