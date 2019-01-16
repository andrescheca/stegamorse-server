const baudio = require('baudio');
const uuidv1 = require('uuid/v1');
const { deleteOldFiles } = require('./utils');

const tau = 2 * Math.PI;
const timeUnit = 0.0625;

/**
 * Returns the time a beep should play for a given character.
 * @param {String} letter A single character.
 * @returns An object with the time and a flag indicating if it has a sound or not.
 */
const getTime = letter => {
  if (letter === '.') {
    return { time: timeUnit, sound: true };
  } else if (letter === '-') {
    return { time: 3 * timeUnit, sound: true };
  } else if (letter === '|') {
    return { time: timeUnit, sound: false };
  }
  return { time: timeUnit, sound: false };
};
/**
 * Returns the sine value for given amplitude and frequency.
 * @param {int} t The amplitude for the Sine wave.
 * @param {int} freq The frequency for the Sine wave.
 */
const sin = (t, freq) => Math.sin(tau * t * freq);

/**
 * Returns a Promise that creates an audio file given the message, frequency and location.
 * @param {String} message A message string.
 * @param {int} freq The frequency to use.
 * @param {String} location The location of the file.
 * @param {int} sampleRate The sample rate to use. By default it is 48000.
 * @returns The location of the new file.
 */
const createFile = (message, freq, location, sampleRate = 48000) =>
  new Promise(resolve => {
    deleteOldFiles(location);
    const times = message
      .split('')
      .join('|')
      .concat('eof')
      .split('')
      .map(letter => getTime(letter));

    let index = 0;
    let startTime = 0;
    console.log(`Using sample rate: ${sampleRate}`);
    const b = baudio({ rate: sampleRate }, t => {
      const data = times[index % times.length];
      if (t - startTime < data.time) {
        return sin(t, freq) * data.sound;
      }
      index += 1;
      startTime = t;
      if (index >= times.length) {
        b.end();
        return sin(t, freq) * false;
      }
      return 0;
    });
    const filename = `${uuidv1()}`;
    const newFile = b.record(`${location}${filename}.wav`);
    newFile.on('close', () => {
      resolve(`${filename}`);
    });
    newFile.on('error', errorClose => {
      console.log(errorClose.toString('utf8'));
      // Promise.reject(new Error('Could not create the file'));
    });
  });

/**
 * Creates an audio file given the message, frequency and location.
 * @param {String} message A message string.
 * @param {int} freq The frequency to use.
 * @param {String} location The location of the file.
 * @param {int} sampleRate The sample rate to use.
 * @returns The location of the new file.
 */
const createFileAsync = async (message, freq, location, sampleRate) => {
  const filename = await createFile(message, freq, location, sampleRate);
  return filename;
};

module.exports = { createFileAsync };
