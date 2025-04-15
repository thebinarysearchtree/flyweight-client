import { watch } from 'fs';
import makeFiles from './makeFiles.js';
import makeTypes from './makeTypes.js';

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
      await makeTypes({
        db,
        paths,
        testMode: true
      });
    }
    catch (e) {
      console.log(e.message);
    }
  });
}

export default watcher;
