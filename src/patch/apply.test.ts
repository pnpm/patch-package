import * as fs from "fs-extra"
import * as os from "os"
import * as path from "path"

import { executeEffects } from "./apply"
import { parsePatchFile } from "./parse"

function applyToFile(contents: string, patch: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "patch-package-apply-"))
  const cwd = process.cwd()
  process.chdir(dir)
  try {
    fs.writeFileSync("file.txt", contents)
    executeEffects(parsePatchFile(patch), { dryRun: false })
    return fs.readFileSync("file.txt", "utf8")
  } finally {
    process.chdir(cwd)
    fs.removeSync(dir)
  }
}

describe("applying a hunk to a file without a final newline", () => {
  // `git diff --ignore-cr-at-eol` writes lines appended to such a file as
  // context followed by the insertion.
  it("keeps the last appended line when the insertion is marked", () => {
    const patch = `diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,4 @@
 one
 two
+three
+four
\\ No newline at end of file
`
    expect(applyToFile("one\ntwo", patch)).toBe("one\ntwo\nthree\nfour")
  })

  it("keeps the last appended line when the replaced last line is unmarked", () => {
    const patch = `diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,2 @@
 one
-two
+TWO
\\ No newline at end of file
`
    expect(applyToFile("one\ntwo", patch)).toBe("one\nTWO")
  })

  // pnpm's patch-commit strips the patch's final marker, so an append that
  // keeps the file without a final newline can arrive unmarked.
  it("leaves an unmarked append without a final newline", () => {
    const patch = `diff --git a/file.txt b/file.txt
--- a/file.txt
+++ b/file.txt
@@ -1,2 +1,3 @@
 one
 two
+three
`
    expect(applyToFile("one\ntwo", patch)).toBe("one\ntwo\nthree")
  })
})
