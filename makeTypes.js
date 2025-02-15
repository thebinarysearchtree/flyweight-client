import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const makeTypes = async (db, paths, getSample) => {
  try {
    if (!db.supports.files) {
      await makeFiles(paths);
    }
    await db.makeTypes(fileSystem, paths, getSample);
    console.log('Types updated');
    process.exit();
  }
  catch (e) {
    if (db.supports.closing) {
      await db.close();
    }
    throw e;
  }
  finally {
    if (db.supports.closing) {
      await db.close();
    }
  }
}

export default makeTypes;
