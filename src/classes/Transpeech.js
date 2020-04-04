/* eslint-disable consistent-return */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
import Voice from './Voice';
import PermissionStatusesModel from '../models/PermissionStatuses';
import ErrorsModel from '../models/Errors';

const DEFAULTS = {
  RECOGNITION_LANG: 'ru',
  CONTINUOUS: true,
  getUserMediaOptions: {
    audio: true,
  },
  permissionsQueryOptions: {
    name: 'microphone',
  },
};

const PERMISSIONS_TO_START = [
  PermissionStatusesModel.GRANTED,
];

const EventNamesModel = {
  PARTLY_RECOGNIZED: 'partly-recognized',
  FULLY_RECOGNIZED: 'recognized',
};

class TranSpeech extends EventTarget {
  constructor() {
    super();
    this.mediaStream = null;
    this.isRecognitionActive = false;
    this.permissionStatus = null;
    this.voices = [];

    this.ready = this.detectFeatures();

    if (!this.ready) {
      TranSpeech.throw(ErrorsModel.INSTANCE_NOT_CREATED);
      return undefined;
    }

    this.recognizer.continuous = DEFAULTS.CONTINUOUS;
    this.recognizer.lang = DEFAULTS.RECOGNITION_LANG;

    this.recognizer.onresult = (event) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        this.fullyRecognized(result[0].transcript);
      } else {
        this.partlyRecognized(result[0].transcript);
      }
    };
  }

  detectFeatures() {
    const recognitionFeature = self.speechRecognition || self.webkitSpeechRecognition;
    const fetchFeatue = self.fetch;
    const syntesisFeature = self.speechSynthesis;
    const mediaDevicesFeature = self.navigator.mediaDevices;
    const permissionsFeature = self.navigator.permissions;

    if (!recognitionFeature) {
      TranSpeech.throw(ErrorsModel.NOT_SUPPORT_RECOGNIRION);
      return false;
    }

    if (!fetchFeatue) {
      TranSpeech.throw(ErrorsModel.NOT_SUPPORT_FETCH);
      return false;
    }

    if (!syntesisFeature || !syntesisFeature.getVoices) {
      TranSpeech.throw(ErrorsModel.NOT_SUPPORT_SYNTESIS);
      return false;
    }

    if (!mediaDevicesFeature) {
      TranSpeech.throw(ErrorsModel.NOT_SUPPORT_MEDIA);
      return false;
    }

    if (!permissionsFeature) {
      TranSpeech.throw(ErrorsModel.NOT_SUPPORT_PERMISSIONS);
      return false;
    }

    this.fetch = fetchFeatue.bind(self);
    // eslint-disable-next-line new-cap
    this.recognizer = new recognitionFeature();
    this.synthesizer = syntesisFeature;
    this.mediaDevices = mediaDevicesFeature;
    this.permissions = permissionsFeature;

    return true;
  }

  async init() {
    if (!this.ready) {
      return false;
    }

    return Promise.all([
      this.getVoices(),
      this.getPermissionStatus(),
    ]);
  }

  getVoices() {
    return new Promise((resolve) => {
      if (!this.ready) {
        return false;
      }

      const i = setInterval(() => {
        if (this.synthesizer.getVoices().length > 0) {
          const voices = this.synthesizer.getVoices();
          this.voices = Object.entries(voices).map(([id, voice]) => new Voice(+id, voice));
          // eslint-disable-next-line prefer-destructuring
          this.activeVoice = this.voices[0];
          clearInterval(i);
          resolve(this);
        }
      }, 10);
    });
  }

  requestPermission(request = DEFAULTS.getUserMediaOptions) {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        return false;
      }

      this.mediaDevices.getUserMedia(request)
        .then((mediaStream) => {
          this.mediaStream = mediaStream;
          this.getPermissionStatus()
            .then(() => {
              resolve(mediaStream);
            });
        })
        .catch((e) => {
          this.getPermissionStatus()
            .then(() => {
              TranSpeech.throw(ErrorsModel.PERMISSION_DECLINED);
              reject(e);
            });
        });
    });
  }

  async getPermissionStatus(query = DEFAULTS.permissionsQueryOptions) {
    if (!this.ready) {
      return false;
    }

    const permission = await this.permissions.query(query);
    this.permissionStatus = permission.state;
    return this.permissionStatus;
  }

  static throw(error) {
    const errorTypeName = Object.entries(ErrorTypesModel)
      .find(([, errType]) => errType === error.type)[0];

    const message = `[SpeechTranslator ${errorTypeName}]: ${error.message}`;

    // eslint-disable-next-line no-console
    console[errorTypeName.toLowerCase()](message);
  }

  speak(text) {
    if (!this.ready) {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.activeVoice.voice;
    this.synthesizer.speak(utterance);
  }

  setActiveVoice(voiceId) {
    if (!this.ready) {
      return false;
    }

    let voice;

    if (typeof voiceId === 'number') {
      voice = this.voices.find((v) => v.id === voiceId);
    } else {
      voice = this.voices.find((v) => v.name.toLowerCase().includes(voiceId)
       || v.lang.toLowerCase().includes(voiceId));
    }

    if (!voice) {
      TranSpeech.throw(ErrorsModel.WRONG_VOICE);
      if (!navigator.onLine) {
        TranSpeech.throw(ErrorsModel.DUE_TO_OFFLINE);
      }
      return false;
    }

    this.activeVoice = voice;
    return this.activeVoice;
  }

  setRecognitionLang(lang) {
    if (!this.ready) {
      return false;
    }

    this.recognizer.lang = lang;
    return true;
  }

  async translate(text, lang) {
    if (!this.ready) {
      return false;
    }

    if (!navigator.onLine) {
      TranSpeech.throw(ErrorsModel.TRANSLATION_UNAVAILABLE);
      TranSpeech.throw(ErrorsModel.DUE_TO_OFFLINE);
      return flase;
    }

    const url = new URL('https://translate.googleapis.com/translate_a/single');

    const params = {
      client: 'gtx',
      sl: 'auto',
      tl: lang,
      dt: 't',
      q: text,
    };

    url.search = new URLSearchParams(params).toString();

    const response = await this.fetch(url);

    if (!response.ok) {
      TranSpeech.throw(ErrorsModel.TRANSLATION_ERROR);
      return false;
    }

    let translatedText = await response.json();

    if (!translatedText[0]) {
      TranSpeech.throw(ErrorsModel.NOTHING_TO_TRANSLATE);
      return false;
    }

    // eslint-disable-next-line prefer-destructuring
    translatedText = translatedText[0][0][0];
    return translatedText;
  }

  startRecognition() {
    if (!this.ready) {
      return false;
    }

    if (!PERMISSIONS_TO_START.includes(this.permissionStatus)) {
      TranSpeech.throw(ErrorsModel.PERMISSION_DECLINED);
      return false;
    }

    if (this.isRecognitionActive) {
      return false;
    }

    this.isRecognitionActive = true;
    this.recognizer.start();
    return true;
  }

  stopRecognition() {
    if (!this.ready) {
      return false;
    }

    if (this.isRecognitionActive) {
      this.isRecognitionActive = false;
      this.recognizer.stop();
      return true;
    }

    return false;
  }

  partlyRecognized(result) {
    if (!this.ready) {
      return false;
    }

    const e = new Event(EventNamesModel.PARTLY_RECOGNIZED);
    e.result = result;
    this.dispatchEvent(e);
    return true;
  }

  fullyRecognized(result) {
    if (!this.ready) {
      return false;
    }

    const e = new Event(EventNamesModel.FULLY_RECOGNIZED);
    e.result = result;
    this.dispatchEvent(e);
    return true;
  }
}

export default TranSpeech;
