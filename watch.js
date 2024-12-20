import { watch } from 'fs';
import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const watcher = (db, paths, dbType) => {
  process.on('beforeExit', async () => {
    if (dbType === 'sqlite') {
      await db.close();
    }
  });

  console.log('watching for changes');
  if (dbType === 'd1') {
    makeFiles(paths);
  }
  watch(paths.sql, { recursive: true }, async () => {
    try {
      if (dbType === 'd1') {
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
