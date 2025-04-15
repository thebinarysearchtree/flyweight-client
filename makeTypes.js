import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const makeTypes = async (options) => {
  const { db, paths, sample, testMode } = options;
  try {
    if (!db.supports.files) {
      await makeFiles(paths);
    }
    await db.makeTypes(fileSystem, paths, sample);
    if (!testMode) {
      console.log('Types updated');
      process.exit();
    }
  }
  catch (e) {
    if (!testMode && db.supports.closing) {
      await db.close();
    }
    throw e;
  }
  finally {
    if (!testMode && db.supports.closing) {
      await db.close();
    }
  }
}

export default makeTypes;
