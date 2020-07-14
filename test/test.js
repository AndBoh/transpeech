import TranSpeech from '../dist/index';
import { Events } from "../dist/index";

function elem(value, tag = 'h1', parent = document.body) {
  const e = document.createElement(tag);
  e.innerText = value;
  parent.appendChild(e);
  return e;
}

elem('1. Available Features Test');
let tmp = TranSpeech.availableFeatures;
let keys = ['synthesis', 'translation', 'recognition'];
let list = elem('', 'ul');
keys.forEach((key) => {
  let result = `${key}: `;
  result += tmp.hasOwnProperty(key) ? 'OK - ' : 'FAIL - ';
  result += !!tmp[key];
  elem(result, 'li', list);
});

elem('2. Create instance')
elem('2.1. Without param', 'h2')
let ts = new TranSpeech();

if (ts instanceof TranSpeech && ts.ready && !ts.silent) {
  elem('OK', 'div')
} else {
  elem('FAIL', 'div')
}

list = elem('', 'ul');
['recognizer', 'synthesizer', 'fetch'].forEach((key) => {
  let result = `${key}: `;
  result += ts.hasOwnProperty(key) ? 'OK - ' : 'FAIL - ';
  result += !!ts[key];
  elem(result, 'li', list);
});

ts.requestPermission();


// let a = document.createElement('h1');
// a.innerText = ''
// const ts = new TranSpeech();
// console.log(ts.voices)
