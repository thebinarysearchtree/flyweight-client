import { watch } from 'fs';
import makeTypes from './makeTypes.js';

const watcher = (db, paths) => {
  process.on('beforeExit', async () => {
    await db.close();
  });

  console.log('watching for changes');
  watch(paths.sql, { recursive: true }, async () => {
    try {
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
