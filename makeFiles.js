import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const readSql = async (path) => {
  let sql = '';
  if (path.endsWith('.sql')) {
    sql = await readFile(path, 'utf8');
  }
  else {
    const names = await readdir(path);
    for (const name of names) {
      if (name.endsWith('.sql')) {
        let text = await readFile(join(path, name), 'utf8');
        text = text.trim();
        if (!text.endsWith(';')) {
          text += ';';
        }
        text += '\n\n';
        sql += text;
      }
    }
  }
  return sql.trim() + '\n';
}

const makeFiles = async (paths) => {
  const tables = await readSql(paths.tables);
  const views = await readSql(paths.views);
  let computed;
  try {
    computed = await readFile(paths.computed, 'utf-8');
  }
  catch {
    computed = JSON.stringify([]);
  }
  let files = `const files = {
    tables: \`${tables.trim()}\`,
    views: \`${views.trim()}\`,
    computed: \`${computed.trim()}\`,
    queries: {`;
  const folders = await readdir(paths.sql);
  for (const folder of folders) {
    if (folder.endsWith('.sql')) {
      continue;
    }
    files += `${folder}: {`;
    const path = join(paths.sql, folder);
    let queries;
    try {
      queries = await readdir(path);
    }
    catch {
      continue;
    }
    for (const query of queries) {
      if (!query.endsWith('.sql')) {
        continue;
      }
      const path = join(paths.sql, folder, query);
      const sql = await readFile(path);
      files += `${query.substring(0, query.length - 4)}: \`${sql}\`,`;
    }
    if (files.endsWith(',')) {
      files = files.substring(0, files.length - 1);
    }
    files += '},';
  }
  if (files.endsWith(',')) {
    files = files.substring(0, files.length - 1);
  }
  files += `}\n}; export default files;\n`
  await writeFile(paths.files, files);
}

export default makeFiles;
