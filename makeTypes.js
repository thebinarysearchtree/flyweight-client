import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const makeTypes = async (db, paths) => {
  try {
    if (db.d1) {
      await makeFiles(paths);
    }
    await db.makeTypes(fileSystem, paths);
    console.log('Types updated');
  }
  catch (e) {
    console.log(e.message);
  }
  finally {
    await db.close();
  }
}

export default makeTypes;
