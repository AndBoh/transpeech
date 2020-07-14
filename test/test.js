import TranSpeech from '../dist/index';
import { Events } from "../dist/index";
let av;

function createElement(value, tag = 'div', parent = document.body) {
  const e = document.createElement(tag);
  e.innerText = value;
  parent.appendChild(e);
  return e;
}

createElement('Available Features Test', 'h2');
let tmp = TranSpeech.availableFeatures;
let keys = ['synthesis', 'translation', 'recognition'];
let list = createElement('');
list.classList.add('table-3');
keys.forEach((key) => {
  createElement(key.toUpperCase(), 'span', list);
  createElement(tmp.hasOwnProperty(key) ? 'OK' : 'FAIL', 'span', list);
  createElement(tmp[key] ? 'Active' : 'Inactive', 'span', list);
});

let ts = new TranSpeech();

if (ts.ready) {
  createElement('Instance created')
}

ts.on(Events.PermissionStatusReady, (status) => {
  createElement('Permission status ready event recieved. Status: ');
  let ps = createElement(status.result, 'span');
  ps.classList.add('permission-status');
});

ts.on(Events.VoicesReady, (status) => {
  createElement('Voices ready event recieved. Voices count: ');
  createElement(status.result.length, 'span');
  createElement('Active voice name: ');
  av = createElement(ts.activeVoice.name, 'span');

  for (let i = 0; i < 3; i++) {
    let o = createElement(status.result[i].name, 'option', voices);
    o.setAttribute('value', status.result[i].id);
  }
});

ts.on(Events.FullyRecognized, (e) => {
  createElement(`Fully recognized: ${e.result}`);
});

ts.on(Events.PartlyRecognized, (e) => {
  createElement(`Partly recognized: ${e.result}`);
});

ts.recognitionLang = 'ru';
createElement('Recognition lang:');
createElement(ts.recognitionLang, 'span');


createElement('Is recognition active:');
let ira = createElement(ts.isRecognitionActive, 'span');

createElement('Actions', 'h2');

let rpb = createElement('Request permisson', 'button');
rpb.onclick = () => {
  ts.requestPermission().then(result => {
    document.querySelector('.permission-status').innerText = ts.permissionStatus;
    console.log(result)
  }).catch(() => {
    document.querySelector('.permission-status').innerText = ts.permissionStatus;
  })
}

createElement('Set active voice:');
let voices = createElement('', 'select');
voices.onchange = (e) => {
  ts.setActiveVoice(+e.target.value);
  av.innerText = ts.activeVoice.name;
}

let sp = createElement('Speak', 'button');
sp.onclick = () => {
  ts.speak('Hello TranSpeech!');
}

createElement('Translate "Hello world" to Italian:');
let it = createElement('', 'span');
ts.translate('Hello word', 'it').then(result => {
  it.innerText = result;
});

let startr = createElement('Start recognition', 'button');
startr.onclick = () => {
  ts.startRecognition();
  ira.innerText = ts.isRecognitionActive;
}

let stopr = createElement('Stop recognition', 'button');
stopr.onclick = () => {
  ts.stopRecognition();
  ira.innerText = ts.isRecognitionActive;
}


createElement('Events', 'h2');