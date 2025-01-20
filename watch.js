import { watch } from 'fs';
import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const watcher = (db, paths) => {
  const features = db.supports;
  process.on('beforeExit', async () => {
    if (features.closing) {
      await db.close();
    }
  });

  console.log('watching for changes');
  if (!features.files) {
    makeFiles(paths);
  }
  watch(paths.sql, { recursive: true }, async () => {
    try {
      if (!features.files) {
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
