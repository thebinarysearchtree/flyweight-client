import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import fileSystem from './files.js';
import makeFiles from './makeFiles.js';
import { execSync } from 'child_process';

const now = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const createMigration = async (db, paths, name, reset) => {
  const lastTablesPath = join(paths.migrations, 'lastTables.sql');
  const lastViewsPath = join(paths.migrations, 'lastViews.sql');
  let lastTables;
  let lastViews;
  try {
    lastTables = await readFile(lastTablesPath, 'utf8');
  }
  catch {
    lastTables = '';
  }
  try {
    lastViews = await readFile(lastViewsPath, 'utf8');
  }
  catch {
    lastViews = '';
  }
  const migrationPath = paths.wrangler || join(paths.migrations, `${name}.sql`);
  const undo = async () => {
    if (!reset) {
      await rm(migrationPath);
    }
    await writeFile(lastTablesPath, lastTables);
    await writeFile(lastViewsPath, lastViews);
  };
  const sql = await db.createMigration(fileSystem, paths, name, reset);
  return {
    sql,
    undo
  }
};

const getName = (features) => {
  if (!features.migrations) {
    if (process.argv.length > 3) {
      return process.argv[3];
    }
    return process.argv[2];
  }
  if (process.argv.length > 2) {
    const name = process.argv[2];
    return `${now()}_${name}`;
  }
  return now();
}

const prompt = async (db, paths, reset, dbName) => {
  const features = db.supports;
  process.on('beforeExit', async () => {
    if (db.supports.closing) {
      await db.close();
    }
  });
  const name = reset ? 'reset' : getName(features);

  let migration;
  try {
    if (!features.migrations && !reset) {
      if (process.argv.length > 3) {
        dbName = process.argv[2];
      }
      const out = execSync(`npx wrangler d1 migrations create ${dbName} ${name}`);
      const match = /Successfully created Migration \'(?<fileName>.+\.sql)\'\!/.exec(out);
      if (!match) {
        throw e;
      }
      const fileName = match.groups.fileName;
      const path = join(paths.wranglerMigrations, fileName);
      paths.wrangler = path;
    }
    migration = await createMigration(db, paths, name, reset);
  }
  catch (e) {
    console.log(e);
    console.log('Error creating migration:\n');
    if (features.closing) {
      await db.close();
    }
    process.exit();
  }
  if (!migration.sql) {
    console.log('No changes detected.');
    if (!features.migrations) {
      await rm(paths.wrangler);
    }
    else if (features.closing) {
      await db.close();
    }
    process.exit();
  }
  console.log(`\n${migration.sql}\n`);
  if (!reset) {
    console.log('Edit the migration file if necessary.');
  }
  const rl = readline.createInterface({ input, output });
  const question = reset ? 'Import tables?' : 'Run migration?';
  const response = await rl.question(`${question} (y)/n:\n`);
  rl.close();
  if (response === 'n') {
    await migration.undo();
    return false;
  }
  else {
    if (reset) {
      console.log('Tables imported');
      return true;
    }
    try {
      if (!features.migrations) {
        execSync(`npx wrangler d1 migrations apply ${dbName} --local`);
        await makeFiles(paths);
      }
      else {
        const path = join(paths.migrations, `${name}.sql`);
        const sql = await readFile(path, 'utf8');
        await db.runMigration(sql);
      }
      console.log('Migration ran successfully.');
    }
    catch (e) {
      await migration.undo();
      console.log('\nMigration rolled back due to:\n');
      throw e;
    }
    await db.makeTypes(fileSystem, paths);
    return true;
  }
}

export default prompt;
