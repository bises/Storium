## Development Workarounds & Notes

Whenever a workaround, hack, or special environment/configuration step is discovered during development (such as SSL bypasses, proxy issues, or platform-specific fixes), document it here with a clear description and the context in which it should be used.

**Example:**

- If you encounter SSL certificate errors with Prisma CLI behind a corporate proxy, use:
  ```bash
  NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate
  ```
- If a package requires a specific Node.js version, note the version and why.
- If a tool or library needs a manual patch, describe the patch and affected files.

Keep this section up to date as the project evolves.
