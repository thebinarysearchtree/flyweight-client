import { watch } from 'fs';
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const watcher = (db, paths) => {
  process.on('exit', async () => await db.close());

  console.log('watching for changes');
  watch(paths.sql, { recursive: true }, async () => {
    try {
      await db.makeTypes({
        readFile,
        writeFile,
        readdir,
        join
      });
    }
    catch (e) {
      console.log(e.message);
    }
  });
}

export default watcher;
