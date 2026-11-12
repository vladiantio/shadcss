# Releasing

`loseta` is published to npm from the **Publish** workflow
(`.github/workflows/publish.yml`) when a GitHub release is published. The
workflow validates the registry, checks that the release tag matches the package
version, and publishes `packages/loseta` with provenance.

## One-time bootstrap (0.1.0)

npm trusted publishing can only be configured after a package exists, so the
first version uses a temporary `NPM_TOKEN` repository secret. Later releases use
OIDC and need no secret.

1. Create a granular access token on npmjs.com. The package does not exist yet,
   so grant it **All packages** read and write access, enable **Bypass 2FA**,
   and set a short expiry. Direct publishing with bypass-2FA tokens is
   deprecated in January 2027; this token is only for the 0.1.0 bootstrap.
2. Add it as the `NPM_TOKEN` Actions secret:

   ```bash
   gh secret set NPM_TOKEN
   ```

3. Push the release commit and tag:

   ```bash
   git push origin main
   git tag -a v0.1.0 -m "loseta 0.1.0"
   git push origin v0.1.0
   ```

4. Create the GitHub release. The tag must be `v` plus the exact
   `packages/loseta/package.json` version:

   ```bash
   gh release create v0.1.0 --title "loseta 0.1.0" \
     --notes-file CHANGELOG.md
   ```

5. Watch the **Publish** workflow and verify the result:

   ```bash
   npm view loseta version
   npx loseta --help
   ```

## Switch to trusted publishing

After `loseta@0.1.0` exists on npm, bind the workflow to the package and remove
the bootstrap token:

```bash
npm login
npm trust github loseta \
  --file publish.yml \
  --repo vladiantio/loseta \
  --allow-publish \
  --yes
gh secret delete NPM_TOKEN
```

`npm trust` requires npm 11.15 or later and an account with 2FA enabled. You can
also configure the trusted publisher in the package settings on npmjs.com.
Select **Allow npm publish** as an allowed action.

A new trusted publisher must complete its first successful publish within two
days, or it expires and must be recreated. Configure it when you are ready to
ship the next version, not months in advance.

Once trusted publishing works, set the package's **Publishing access** to
**Require two-factor authentication and disallow tokens**.

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

The workflow skips publishing when the version already exists, so a re-run after
a partial failure is safe.
