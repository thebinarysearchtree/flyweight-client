import { watch } from 'fs';
import fileSystem from './files.js';

const watcher = (db, paths) => {
  process.on('exit', async () => await db.close());

  console.log('watching for changes');
  watch(paths.sql, { recursive: true }, async () => {
    try {
      await db.makeTypes(fileSystem, paths);
    }
    catch (e) {
      console.log(e.message);
    }
  });
}

export default watcher;
