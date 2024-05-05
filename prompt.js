import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import fileSystem from './files.js';
import makeFiles from './makeFiles.js';
import { execSync } from 'child_process';
import toml from 'toml';

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

const createMigration = async (db, paths, name) => {
  const lastTablesPath = join(paths.migrations, 'lastTables.sql');
  const lastViewsPath = join(paths.migrations, 'lastViews.sql');
  const lastTables = await readFile(lastTablesPath, 'utf8');
  const lastViews = await readFile(lastViewsPath, 'utf8');
  const migrationPath = paths.wrangler || join(paths.migrations, `${name}.sql`);
  const undo = async () => {
    await rm(migrationPath);
    await writeFile(lastTablesPath, lastTables);
    await writeFile(lastViewsPath, lastViews);
  };
  const sql = await db.createMigration(fileSystem, paths, name);
  return {
    sql,
    undo
  }
};

const prompt = async (db, paths) => {
  let name;
  let dbName;
  if (process.argv.length > 2) {
    name = `${now()}_${process.argv.at(-1)}`;
  }
  else {
    name = now();
  }

  let migration;
  try {
    if (db.d1) {
      let migrationsDir = 'migrations';
      const file = await readFile('wrangler.toml', 'utf8');
      const parsed = toml.parse(file);
      if (process.argv.length > 3) {
        dbName = process.argv[2];
        const config = parsed.d1_databases.find(d => d.database_name === 'dbName');
        if (config.migrations_dir) {
          migrationsDir = config.migrations_dir;
        }
      }
      else {
        if (!parsed.d1_databases || parsed.d1_databases.length > 1) {
          throw Error('No database name supplied');
        }
        const config = parsed.d1_databases[0];
        dbName = config.database_name;
        if (config.migrations_dir) {
          migrationsDir = config.migrations_dir;
        }
      }
      const out = execSync(`npx wrangler d1 migrations create ${dbName} ${name}`);
      const match = /Successfully created Migration \'(?<fileName>.+\.sql)\'\!/.exec(out);
      if (!match) {
        throw e;
      }
      const fileName = match.groups.fileName;
      const path = join('migrations', fileName);
      paths.wrangler = path;
    }
    migration = await createMigration(db, paths, name);
  }
  catch (e) {
    console.log(e);
    console.log('Error creating migration:\n');
    if (!db.d1) {
      await db.close();
    }
    process.exit();
  }
  if (!migration.sql) {
    console.log('No changes detected.');
    if (db.d1) {
      await rm(paths.wrangler);
    }
    process.exit();
  }
  console.log(`\n${migration.sql}\n`);
  console.log('Edit the migration file if necessary.');
  const rl = readline.createInterface({ input, output });
  const response = await rl.question('Run migration? (y)/n:\n');
  rl.close();
  if (response === 'n') {
    try {
      await migration.undo();
    }
    finally {
      if (!db.d1) {
        await db.close();
      }
    }
  }
  else {
    try {
      if (db.d1) {
        execSync(`npx wrangler d1 migrations apply ${dbName}`);
        await makeFiles(paths);
      }
      else {
        const path = join(paths.migrations, `${name}.sql`);
        const sql = await readFile(path, 'utf8');
        await db.runMigration(sql);
      }
      await db.makeTypes(fileSystem, paths);
      console.log('Migration ran successfully.');
    }
    catch (e) {
      await migration.undo();
      console.log('\nMigration rolled back due to:\n');
      throw e;
    }
    finally {
      if (!db.d1) {
        await db.close();
      }
    }
  }
}

export default prompt;
