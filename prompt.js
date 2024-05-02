import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { readFile, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import fileSystem from './files.js';

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
  const migrationPath = join(paths.migrations, `${name}.sql`);
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
  if (process.argv.length > 2) {
    name = `${now()}_${process.argv[2]}`;
  }
  else {
    name = now();
  }

  let migration;
  try {
    migration = await createMigration(db, paths, name);
  }
  catch (e) {
    console.log('Error creating migration:\n');
    await db.close();
    process.exit();
  }
  if (!migration.sql) {
    console.log('No changes detected.');
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
      await db.close();
    }
  }
  else {
    try {
      await db.runMigration(name);
      await db.makeTypes(fileSystem, paths);
      console.log('Migration ran successfully.');
    }
    catch (e) {
      await migration.undo();
      console.log('\nMigration rolled back due to:\n');
      throw e;
    }
    finally {
      await db.close();
    }
  }
}

export default prompt;
