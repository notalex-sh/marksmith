// Parses Netscape bookmark HTML files into a tree of folders and bookmarks.

import type { TreeNode, Folder } from './types';
import { makeFolder, makeBookmark } from './tree-utils';

// Parses a Netscape bookmark HTML string and returns the top-level nodes.
export function parseNetscapeHTML(src: string): TreeNode[] {
  let html = String(src || '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  const tokenRe =
    /<\/?DL\b[^>]*>|<DT\b[^>]*>|<DD\b[^>]*>|<H3\b[^>]*>[\s\S]*?<\/H3>|<A\b[^>]*>[\s\S]*?<\/A>/gi;

  const roots: TreeNode[] = [];
  const stack: { children: TreeNode[] }[] = [{ children: roots }];
  let current = roots;
  let lastNode: TreeNode | null = null;

  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(html)) !== null) {
    const tok = m[0];
    const isClose = /^<\//.test(tok);
    const tagName = (tok.match(/^<\/?(\w+)/) || [, ''])[1].toUpperCase();

    if (tagName === 'DT' || tagName === 'DD') continue;

    if (tagName === 'DL') {
      if (isClose) {
        if (stack.length > 1) stack.pop();
        current = stack[stack.length - 1].children;
        lastNode = null;
      } else {
        const target =
          lastNode && lastNode.type === 'folder'
            ? (lastNode as Folder).children
            : current;
        stack.push({ children: target });
        current = target;
      }
      continue;
    }

    if (tagName === 'H3') {
      const attr = (tok.match(/<H3\b([^>]*)>/i) || [, ''])[1];
      const titleRaw = tok.replace(/^[\s\S]*?>/, '').replace(/<\/H3>$/i, '');
      const title = decodeEntities(titleRaw.trim());
      const f = makeFolder(title);
      const add = parseInt(getAttr(attr, 'ADD_DATE') || '');
      if (add) f.addDate = add;
      const lm = parseInt(getAttr(attr, 'LAST_MODIFIED') || '');
      if (lm) f.lastModified = lm;
      if (hasBooleanAttr(attr, 'PERSONAL_TOOLBAR_FOLDER'))
        f.personalToolbarFolder = true;
      current.push(f);
      lastNode = f;
      continue;
    }

    if (tagName === 'A') {
      const attr = (tok.match(/<A\b([^>]*)>/i) || [, ''])[1];
      const textRaw = tok.replace(/^[\s\S]*?>/, '').replace(/<\/A>$/i, '');
      const text = decodeEntities(textRaw.trim());
      const href = getAttr(attr, 'HREF');
      if (href) {
        const iconData = getAttr(attr, 'ICON') || null;
        const iconURI = getAttr(attr, 'ICON_URI') || null;
        const bm = makeBookmark(href, text || href, iconData, iconURI);
        const add = parseInt(getAttr(attr, 'ADD_DATE') || '');
        if (add) bm.addDate = add;
        current.push(bm);
        lastNode = bm;
      }
      continue;
    }
  }
  return roots;
}

// Extracts a named attribute value from an HTML attribute string.
function getAttr(attrString: string, name: string): string | null {
  if (!attrString) return null;
  const re = new RegExp(name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i');
  const m = re.exec(attrString);
  if (!m) return null;
  return m[2] != null ? m[2] : m[3] ?? null;
}

// Checks if a boolean attribute exists in an HTML attribute string.
function hasBooleanAttr(attrString: string, name: string): boolean {
  if (!attrString) return false;
  const re = new RegExp('\\b' + name + '(\\s*=\\s*(".*?"|\'.*?\'))?\\b', 'i');
  return re.test(attrString);
}

// Decodes HTML entities using a textarea element.
function decodeEntities(s: string): string {
  const el = document.createElement('textarea');
  el.innerHTML = s;
  return el.value;
}
