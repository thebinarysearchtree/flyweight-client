import fileSystem from './files.js';

const makeTypes = async (db, paths) => {
  try {
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
