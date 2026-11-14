const demoAttribute = /\sdata-(?:demo(?:-[a-z-]+)?|open-dialog|close-dialog)(?:="[^"]*")?/g;

/**
 * Removes docs-only hooks from example markup. The docs preview keeps the
 * original HTML; the code shown to readers and the generated registry examples
 * both use this transform so the snippet matches what the CLI writes.
 */
export function stripDemoHooks(html: string): string {
  return html.replace(demoAttribute, "").trim();
}
