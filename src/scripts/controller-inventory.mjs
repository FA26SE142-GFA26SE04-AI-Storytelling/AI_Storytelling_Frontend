import fs from 'node:fs';
import path from 'node:path';

/** Read attribute-routed actions, including inherited and absolute routes. */
export function controllerInventory(directory) {
  const base = fs.readFileSync(path.join(directory, 'BaseApiController.cs'), 'utf8');
  const inheritedRoute = base.match(/\[Route\("([^"]+)"\)\]/)?.[1];
  if (!inheritedRoute) throw new Error('BaseApiController route not found');
  const routes = [];
  for (const file of fs.readdirSync(directory).filter(name => name.endsWith('Controller.cs')).sort()) {
    const source = fs.readFileSync(path.join(directory, file), 'utf8');
    const classIndex = source.search(/public\s+(?:(?:sealed|abstract|partial)\s+)*class\s/);
    if (classIndex < 0) throw new Error(`Controller class not found: ${file}`);
    const header = source.slice(0, classIndex);
    const prefix = header.match(/\[Route\("([^"]+)"\)\]/)?.[1] ?? inheritedRoute;
    const controller = file.replace(/Controller\.cs$/, '');
    const httpAttributes = [...source.matchAll(/^\s*\[Http(Get|Post|Put|Patch|Delete)(?:\("([^"]*)"\))?\]/gm)];
    for (const attribute of httpAttributes) {
      const methodStart = source.indexOf('public ', attribute.index + attribute[0].length);
      if (methodStart < 0) throw new Error(`Action not found: ${file}:${attribute.index}`);
      const blockStart = source.lastIndexOf('\n\n', attribute.index);
      const attributes = source.slice(Math.max(classIndex, blockStart), methodStart);
      const action = source.slice(methodStart).match(/\b(\w+)\s*\(/)?.[1];
      const template = attribute[2] ?? '';
      const route = (template.startsWith('/') || template.startsWith('~/')
        ? template.replace(/^~/, '')
        : `/${prefix}/${template}`).replace(/\[controller\]/g, controller)
        .replace(/\{(\w+):[^}]+\}/g, '{$1}').replace(/\/+$/, '');
      const authorization = /\[AllowAnonymous\]/.test(attributes) ? 'AllowAnonymous'
        : [...header.matchAll(/\[Authorize(?:\(([^\]]*)\))?\]/g), ...attributes.matchAll(/\[Authorize(?:\(([^\]]*)\))?\]/g)]
          .map(match => match[1] || 'Authenticated').join('; ') || 'See controller and authentication policy';
      routes.push({ method: attribute[1].toUpperCase(), route, authorization, controller: file, action,
        controllerLine: source.slice(0, attribute.index).split('\n').length });
    }
  }
  const keys = routes.map(item => `${item.method} ${item.route}`);
  if (new Set(keys).size !== keys.length) throw new Error('Duplicate controller routes');
  return routes;
}
