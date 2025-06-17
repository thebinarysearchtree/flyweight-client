import fileSystem from './files.js';

const makeTypes = async (options) => {
  const { db, paths, sample, testMode } = options;
  try {
    await db.makeTypes(fileSystem, paths, sample);
    if (!testMode) {
      console.log('Types updated');
      process.exit();
    }
  }
  catch (e) {
    if (!testMode) {
      await db.close();
    }
    throw e;
  }
  finally {
    if (!testMode) {
      await db.close();
    }
  }
}

export default makeTypes;
