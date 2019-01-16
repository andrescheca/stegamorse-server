const MAP = {
  a: '.-',
  b: '-...',
  c: '-.-.',
  d: '-..',
  e: '.',
  f: '..-.',
  g: '--.',
  h: '....',
  i: '..',
  j: '.---',
  k: '-.-',
  l: '.-..',
  m: '--',
  n: '-.',
  o: '---',
  p: '.--.',
  q: '--.-',
  r: '.-.',
  s: '...',
  t: '-',
  u: '..-',
  v: '...-',
  w: '.--',
  x: '-..-',
  y: '-.--',
  z: '--..',
  1: '.----',
  2: '..---',
  3: '...--',
  4: '....-',
  5: '.....',
  6: '-....',
  7: '--...',
  8: '---..',
  9: '----.',
  0: '-----',
  ñ: '--.--',
  á: '.--.-',
  é: '..-..',
  í: '..',
  ó: '---.',
  ú: '..--',
  ü: '..--',
  _: '..--.-',
  $: '...-..-',
  '!': '-.-.--',
  '"': '.-..-.',
  '&': '.-...',
  "'": '.----.',
  '(': '-.--.',
  ')': '-.--.-',
  '+': '.-.-.',
  ',': '--..--',
  '-': '-....-',
  '.': '.-.-.-',
  '/': '-..-.',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '?': '..--..',
  '@': '.--.-.',
  ' ': '|',
};

/**
 * @name IterateString
 * @desc Iterate over characters in a String and apply the supplied translate function
 * @param {string} original - The string to translate
 * @param {string} separator - The string that separates each word
 * @param {string} joiner - The string to join each word after translation
 * @param {function} lookup - Function that returns a translated character
 */
const iterateString = (original, separator, joiner, lookup) => {
  const characters = original.toLowerCase().split(separator);
  const list = [];

  characters.forEach(character => {
    list.push(lookup.call(this, MAP, character));
  });

  return list.join(joiner);
};

/**
 * @name EncodeLookup
 * @desc Lookup a Roman character and return the Morse equivalent
 * @param {object} map - The Roman to Morse map object
 * @param {string} character - The Roman character to lookup
 */
const encodeLookup = (map, character) => map[character];

/**
 * @name DecodeLookup
 * @desc Lookup a Morse character and return the Roman equivalent
 * @param {object} map - The Roman to Morse map object
 * @param {string} character - The Morse character to lookup
 */
const decodeLookup = (map, character) =>
  Object.keys(map).filter(key => map[key] === character)[0];

/**
 * @name Encode
 * @desc Translate a Roman String into Morse Code
 * @param {string} str - String to translate
 */
const encode = str => iterateString(str, '', ' ', encodeLookup);

/**
 * @name Decode
 * @desc Translate a Morse String into Roman
 * @param {string} str - String to translate
 */
const decode = str => iterateString(str, ' ', '', decodeLookup);

// Export public methods
module.exports.encode = encode;
module.exports.decode = decode;
