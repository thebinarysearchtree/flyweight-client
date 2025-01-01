import fileSystem from './files.js';
import makeFiles from './makeFiles.js';

const makeTypes = async (db, paths, dbType) => {
  try {
    if (dbType !== 'sqlite') {
      await makeFiles(paths);
    }
    await db.makeTypes(fileSystem, paths, dbType);
    console.log('Types updated');
  }
  catch (e) {
    console.log(e.message);
  }
  finally {
    if (dbType === 'sqlite') {
      await db.close();
    }
  }
}

export default makeTypes;
