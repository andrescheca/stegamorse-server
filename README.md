# S T E G A M O R S E - Server Source Code

This is the source code for the [STEGAMORSE](https://stegamorse.com) REST API.

## Dependencies

This project uses [NodeJS](https://nodejs.org/en/download/package-manager/), [Python](https://www.python.org/downloads/) and [SoX](http://sox.sourceforge.net/).

### Install Python dependencies

`apt-get install -y python-scipy python-matplotlib python-numpy`

To have MP3 support for SoX you will need to run:
`apt-get install -y libsox-fmt-mp3`

## Installation

`npm install`

## Run

`npm start`

## Instructions

This will start up the REST server, there are two endpoints `http://localhost:3000/app/api/v1/morse` and `http://localhost:3000/app/api/v1/extract`.

They both receive data through a POST request.

The `/morse` endpoint requires you to send the following data in a POST request:
`message, option, audio`

`message`: Could be any string.\
`option`: Can be either `upload-file` or `sample`.\
`audio`: An file being uploaded to the server.

The `/extract` endpoint requires you to send the following data in a POST request:
`audio`

`audio`: A .wav file created by this tool to extract the data.
