#!/usr/bin/env bash
set -euo pipefail

echo "▶ Starting bulk fix for ContactsTab usages..."

# Find files that reference ContactsTab
files=$(git grep -l "ContactsTab" || true)
if [ -z "$files" ]; then
  echo "⚠️  No files found referencing ContactsTab. Exiting."
  exit 0
fi

echo "Found files:"
echo "$files"
echo

# For each file, make backup, inject restroCode if missing, replace JSX usage
for f in $files; do
  echo "----"
  echo "Processing: $f"

  # make a backup
  cp "$f" "$f.bak"
  echo "Backup created: $f.bak"

  # 1) If file does not already contain 'restroCode' identifier, insert a robust restroCode compute block
  if ! grep -q -E '\brestroCode\b' "$f"; then
    echo "Inserting restroCode computation into $f..."

    # Find last import line number
    last_import_line=$(nl -ba "$f" | sed -n '1,200p' | awk '/^ *[0-9]+[ \t]+import /{ln=$1} END{print ln+0}')
    if [ -z "$last_import_line" ] || [ "$last_import_line" -eq 0 ]; then
      insert_after=1
    else
      insert_after=$last_import_line
    fi

    # The code block to insert (JS/JSX friendly — no TypeScript)
    read -r -d '' INJECT <<'JSBLOCK' || true
// ---- injected by fix-contacts-restrocode.sh ----
// Ensure restroCode is available for ContactsTab (tries various fallbacks)
let restroCode = "";
try {
  // try server-provided variable names commonly used
  if (typeof restro !== "undefined" && restro) {
    restroCode = String(restro?.RestroCode ?? restro?.code ?? restro?.id ?? "");
  }
  if (!restroCode && typeof vendor !== "undefined" && vendor) {
    restroCode = String(vendor?.VendorCode ?? vendor?.id ?? "");
  }
  if (!restroCode && typeof local !== "undefined" && local) {
    restroCode = String(local?.RestroCode ?? local?.VendorCode ?? local?.id ?? "");
  }
} catch (e) {
  // ignore
  restroCode = String(restroCode || "");
}
// ---- end injected ----
JSBLOCK

    # insert after import block
    awk -v n="$insert_after" -v code="$INJECT" 'NR==n{print; print code; next} {print}' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
    echo "Inserted restroCode after line $insert_after"
  else
    echo "restroCode already present in $f — skipping inject."
  fi

  # 2) Replace JSX usage — tolerant to whitespace and props order around ...common
  echo "Replacing <ContactsTab {...common} /> occurrences in $f ..."

  # Use perl with single-file slurp to replace across lines: finds <ContactsTab ... {...common} ... />
  perl -0777 -pe '
    $orig = $_;
    # replace occurrences where {...common} is present in the tag's attributes
    s{<\s*ContactsTab\b([^>]*?\{\.{3}common\}[^>]*)\/?>}{
        my $attrs = $1;
        # if restroCode already present in attributes, keep as-is
        if ($attrs =~ /\brestroCode\s*=\s*{\s*restroCode\s*}/) {
          "<ContactsTab$attrs/>";
        } else {
          # add restroCode before existing attrs (preserve whitespace)
          $attrs =~ s/^\s*//;
          "<ContactsTab restroCode={restroCode} $attrs/>";
        }
    }ges;
    $_;
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  # show a quick diff summary for this file
  echo "Diff summary for $f (first 40 lines):"
  git --no-pager diff --no-index -- "$f.bak" "$f" | sed -n '1,80p' || true
  echo
done

echo "✅ All files processed. IMPORTANT: review changes with 'git diff' before commit."
echo "Suggested next steps:"
echo "  git add -A"
echo "  git commit -m \"Fix: pass restroCode to ContactsTab usages and inject restroCode fallback\""
echo "  git push origin main"
