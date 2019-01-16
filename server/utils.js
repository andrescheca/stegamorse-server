const { exec } = require('child_process');

/**
 * Deletes files from a given location if a given time has passed.
 * @param {String} location A given location to delete files older than a given time.
 * @param {Number} minutes How many minutes old a file should be to be deleted, 1 hour by default.
 */
const deleteOldFiles = (location, minutes = 60) => {
  exec(`find ${location} -mindepth 1 -type f -mmin +${minutes} -delete`);
};

module.exports = { deleteOldFiles };
