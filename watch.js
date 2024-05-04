import { watch } from 'fs';
import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const watcher = (db, paths) => {
  process.on('exit', async () => {
    if (!db.d1) {
      await db.close();
    }
  });

  console.log('watching for changes');
  watch(paths.sql, { recursive: true }, async () => {
    try {
      if (db.d1) {
        await makeFiles(paths);
      }
      await db.makeTypes(fileSystem, paths);
    }
    catch (e) {
      console.log(e.message);
    }
  });
}

export default watcher;
