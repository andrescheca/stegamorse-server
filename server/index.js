const express = require('express');
const multer = require('multer');
const path = require('path');
const { execSync } = require('child_process');
const audio = require('./audio');
const morse = require('./morse');
const { deleteOldFiles } = require('./utils');

const PORT = 3000;
const HOST = '0.0.0.0';

const apiVersion = '/app/api/v1/';
const upload = multer({
  dest: 'uploads/',
  onError: (err, next) => {
    next(err);
  },
  fileFilter: (req, file, cb) => {
    if (file) {
      if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/wav') {
        return cb(null, true);
      }
      return cb(null, false, new Error('Wrong file type'));
    }
    // Continue if no file has been found
    return cb(null, true);
  },
});
const app = express();

// Set public static folder
app.use('/app/public', express.static(path.join(__dirname, 'public')));

// Handle CORS requests
app.use((req, res, next) => {
  // Do not use * in production, set the real URL here:
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Text to morse endpoint
app.post(`${apiVersion}morse`, upload.single('audio'), async (req, res) => {
  const frequency = 22000;
  const frequencyOffset = 100;
  if (
    req.body.message &&
    req.body.message.trim().length > 0 &&
    req.body.option &&
    req.body.option.trim().length > 0
  ) {
    // Use sample audio file as default
    let originalAudioFile = `${__dirname}/sample.wav`;
    let fileExtension = 'wav';
    // Check if the user uploaded a file or we are using the sample file.
    if (req.body.option === 'upload-file' && req.file) {
      // Delete old files if we are uploading a new one
      deleteOldFiles(`${__dirname}/../${req.file.destination}`);
      originalAudioFile = `${__dirname}/../${req.file.path}.wav`;
      fileExtension = req.file.mimetype === 'audio/mp3' ? 'mp3' : 'wav';
      // Get the original wav file
      // Change it to mono and rate to 48000
      if (req.file.mimetype === 'audio/mp3') {
        execSync(
          `mv ${__dirname}/../${req.file.path} ${__dirname}/../${
            req.file.path
          }.${fileExtension} && sox ${__dirname}/../${
            req.file.path
          }.${fileExtension} -r 48k -c 1 ${originalAudioFile}`
        );
      } else {
        execSync(
          `sox ${__dirname}/../${
            req.file.path
          } -r 48k -c 1 ${originalAudioFile}`
        );
      }
    }
    // Create morse code
    const encodedMessage = morse.encode(req.body.message);
    // Delete old public files to prevent filling disk with old unused files.
    deleteOldFiles(`${__dirname}/public/`, 1440);
    // Create morse audio file in public folder
    const audioFilename = await audio.createFileAsync(
      encodedMessage,
      frequency,
      `${__dirname}/public/`
    );
    // Create audible morse code for debugging
    const morseAudioFileName = await audio.createFileAsync(
      encodedMessage,
      400,
      `${__dirname}/public/`
    );
    // Filtered audio file name
    const filteredFilename = `${__dirname}/public/${audioFilename}-filtered.wav`;
    // Create filtered file according to frequency to remove clipping noises
    execSync(
      `sox ${__dirname}/public/${audioFilename}.wav ${filteredFilename} sinc ${frequency -
        frequencyOffset}-${frequency + frequencyOffset}`
    );
    // Merge the two audio files, the original and the morse code.
    execSync(
      `sox -m ${originalAudioFile} ${__dirname}/public/${audioFilename}-filtered.wav ${__dirname}/public/${audioFilename}-mixed.wav trim 0 \`soxi -D ${originalAudioFile}\``
    );
    /* Process to recover morse message */
    // Create spectrogram
    execSync(
      `sox ${__dirname}/public/${audioFilename}-mixed.wav -n spectrogram -o ${__dirname}/public/${audioFilename}-mixed.png`
    );

    res.send({
      morse: encodedMessage,
      filename: `public/${audioFilename}-mixed`,
      morseAudioFile: `public/${morseAudioFileName}`,
    });
  } else {
    res.send({ error: 'There was an error, please try again.' });
  }
});

// Extract endpoint
app.post(`${apiVersion}extract`, upload.single('audio'), async (req, res) => {
  const frequency = 22000;
  const frequencyOffset = 100;
  // Check if the user uploaded a wav audio file
  if (req.file && req.file.mimetype === 'audio/wav') {
    // Delete old files if we are uploading a new one
    deleteOldFiles(`${__dirname}/../${req.file.destination}`);
    const originalAudioFileName = `${__dirname}/public/${req.file.filename}`;
    // Add the extension to the file
    execSync(
      `mv ${__dirname}/../${req.file.path} ${originalAudioFileName}.wav`
    );
    // Create spectrogram
    execSync(
      `sox ${originalAudioFileName}.wav -n spectrogram -o ${originalAudioFileName}.png`
    );
    // Filtered audio file name
    const filteredFilename = `${originalAudioFileName}-filtered.wav`;
    // Create filtered file according to frequency to remove clipping noises
    execSync(
      `sox ${originalAudioFileName}.wav ${filteredFilename} sinc ${frequency -
        frequencyOffset}-${frequency + frequencyOffset}`
    );
    // Extracts the message
    const extractedMessage = execSync(
      `python -W ignore ${__dirname}/morse-to-text.py ${filteredFilename}`
    ).toString('utf8');

    res.send({
      filename: `public/${req.file.filename}`,
      extracted: extractedMessage,
    });
  } else {
    res.send({
      error:
        'There was an error, please try again. Only wav files generated by this tool are supported.',
    });
  }
});

// Error handler
app.use((error, req, res) => {
  console.log(error.message);
  // res.sendStatus(400);
  res.send({ error: error.message });
});

app.use('*', (req, res) => {
  res.send({ error: 'No such method' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});
