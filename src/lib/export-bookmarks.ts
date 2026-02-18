// Exports the bookmark tree to Netscape bookmark HTML format.

import type { Folder } from './types';

// Escapes a string for safe inclusion in HTML attributes and content.
function esc(s: string | null | undefined): string {
  s = s == null ? '' : '' + s;
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Generates a complete Netscape bookmark HTML file from root folders.
export function exportNetscapeHTML(roots: Folder[]): string {
  const head = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
  const body = roots.map(renderExportFolder).join('');
  const tail = `</DL><p>`;
  return head + body + tail;
}

// Recursively renders a folder and its children as Netscape bookmark HTML.
function renderExportFolder(folder: Folder): string {
  const attrs = [
    `ADD_DATE="${folder.addDate}"`,
    `LAST_MODIFIED="${folder.lastModified || folder.addDate}"`,
    folder.personalToolbarFolder ? 'PERSONAL_TOOLBAR_FOLDER="true"' : '',
  ]
    .filter(Boolean)
    .join(' ');

  let html = `    <DT><H3 ${attrs}>${esc(folder.title)}</H3>\n    <DL><p>\n`;
  for (const ch of folder.children) {
    if (ch.type === 'folder') {
      html += renderExportFolder(ch);
    } else {
      const attrsA = [`HREF="${esc(ch.href)}"`, `ADD_DATE="${ch.addDate}"`];
      if (ch.iconData) attrsA.push(`ICON="${ch.iconData}"`);
      if (ch.iconURI) attrsA.push(`ICON_URI="${ch.iconURI}"`);
      html += `        <DT><A ${attrsA.join(' ')}>${esc(ch.title || ch.href)}</A>\n`;
    }
  }
  html += `    </DL><p>\n`;
  return html;
}
