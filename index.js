class Voice {
  constructor(id, speechSynthesisVoice) {
    this.id = id;
    this.name = speechSynthesisVoice.name;
    this.lang = speechSynthesisVoice.lang;
    this.voice = speechSynthesisVoice;
    this.offline = speechSynthesisVoice.localService;
  }
}

const DEFAULTS = {
  RECOGNITION_LANG: 'ru',
  CONTINUOUS: true,
  getUserMediaOptions: {
    audio: true,
  },
  permissionsQueryOptions: {
    name: 'microphone',
  },
}

const PermissionStatusesModel = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt',
};

const PERMISSIONS_TO_START = [
  PermissionStatusesModel.GRANTED,
];

const ErrorTypesModel = {
  ERROR: 1,
  WARN: 2,
};

const ErrorsModel = {
  NOT_SUPPORT_RECOGNIRION: {
    type: ErrorTypesModel.ERROR,
    message: 'This browser does not support Speech Recognition feature.',
  },

  NOT_SUPPORT_FETCH: {
    type: ErrorTypesModel.ERROR,
    message: 'This browser does not support Fetch feature.',
  },

  NOT_SUPPORT_SYNTESIS: {
    type: ErrorTypesModel.ERROR,
    message: 'This browser does not support Speech Syntesis feature.',
  },

  NOT_SUPPORT_MEDIA: {
    type: ErrorTypesModel.ERROR,
    message: 'This browser does not support Media Devices feature.',
  },

  NOT_SUPPORT_PERMISSIONS: {
    type: ErrorTypesModel.ERROR,
    message: 'This browser does not support Permissions feature.',
  },

  INSTANCE_NOT_CREATED: {
    type: ErrorTypesModel.ERROR,
    message: 'Instance was not created.',
  },

  WRONG_VOICE: {
    type: ErrorTypesModel.WARN,
    message: 'Wrong Voice ID.',
  },

  TRANSLATION_UNAVAILABLE: {
    type: ErrorTypesModel.WARN,
    message: 'Transtalion is unavailable.',
  },

  TRANSLATION_ERROR: {
    type: ErrorTypesModel.WARN,
    message: 'Transtalion service error.',
  },

  DUE_TO_OFFLINE: {
    type: ErrorTypesModel.WARN,
    message: 'This could be due to the fact that you\'re offline.',
  },

  PERMISSION_DECLINED: {
    type: ErrorTypesModel.WARN,
    message: 'User did not give permission.',
  },

  RECOGNITION_ACTIVE: {
    type: ErrorTypesModel.WARN,
    message: 'Recognition already active.',
  },
}

const EventNamesModel = {
  PARTLY_RECOGNIZED: 'partly-recognized',
  FULLY_RECOGNIZED: 'recognized',
}

class TranSpeech extends EventTarget {
  constructor() {
    super();
    this.mediaStream = null,
    this.isRecognitionActive = false,
    this.permissionStatus = null,
    this.voices = [],

    this.ready = this.detectFeatures();    

    if (!this.ready) {
      this.throw(ErrorsModel.INSTANCE_NOT_CREATED);
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
      this.throw(ErrorsModel.NOT_SUPPORT_RECOGNIRION);
      return false;
    }

    if (!fetchFeatue) {
      this.throw(ErrorsModel.NOT_SUPPORT_FETCH);
      return false;
    }

    if (!syntesisFeature || !syntesisFeature.getVoices) {
      this.throw(ErrorsModel.NOT_SUPPORT_SYNTESIS);
      return false;
    }

    if (!mediaDevicesFeature) {
      this.throw(ErrorsModel.NOT_SUPPORT_MEDIA);
      return false;
    }

    if (!permissionsFeature) {
      this.throw(ErrorsModel.NOT_SUPPORT_PERMISSIONS);
      return false;
    }

    this.fetch = fetchFeatue.bind(window);
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

    return await Promise.all([
      this.getVoices(),
      this.getPermissionStatus(),
    ]);
  }

  getVoices() {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        return false;
      }

      let i = setInterval(() => {
        if (this.synthesizer.getVoices().length > 0) {
          const voices = this.synthesizer.getVoices();
          this.voices = Object.entries(voices).map(([id, voice]) => new Voice(+id, voice));
          this.activeVoice = this.voices[0];
          clearInterval(i);
          resolve(this);
        }
      }, 10);
    });
  }

  requestPermission() {
    return new Promise((resolve, reject) => {
      if (!this.ready) {
        return false;
      }

      this.mediaDevices.getUserMedia(DEFAULTS.getUserMediaOptions)
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
            this.throw(ErrorsModel.PERMISSION_DECLINED);
            reject(e);
          });
      });
    });
  }

  async getPermissionStatus() {
    if (!this.ready) {
      return false;
    }

    const permission = await this.permissions.query(DEFAULTS.permissionsQueryOptions);
    this.permissionStatus = permission.state;
    return this.permissionStatus;
  }

  throw(error) {
    const errorTypeName = Object.entries(ErrorTypesModel)
      .find(([name, errType]) => errType === error.type)[0];

    const message = `[SpeechTranslator ${errorTypeName}]: ${error.message}`;

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
      voice = this.voices.find(v => v.id === voiceId);
    } else {
      voice = this.voices.find(v => v.name.toLowerCase().includes(voiceId) || v.lang.toLowerCase().includes(voiceId));
    }

    if (!voice) {
      this.throw(ErrorsModel.WRONG_VOICE);
      if (!navigator.onLine) {
        this.throw(ErrorsModel.DUE_TO_OFFLINE);
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
      this.throw(ErrorsModel.TRANSLATION_UNAVAILABLE);
      this.throw(ErrorsModel.DUE_TO_OFFLINE);
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
      this.throw(ErrorsModel.TRANSLATION_ERROR);
      return false;
    }

    let translatedText = await response.json();
    translatedText = translatedText[0][0][0];
    return translatedText;
  }

  startRecognition() {
    if (!this.ready) {
      return false;
    }

    if (!PERMISSIONS_TO_START.includes(this.permissionStatus)) {
      this.throw(ErrorsModel.PERMISSION_DECLINED);
      return false;
    }

    if (this.isRecognitionActive) {
      console.log(this)
      this.throw(ErrorsModel.RECOGNITION_ACTIVE)
      return false;
    }

    this.isRecognitionActive = true;
    this.recognizer.start();
  }

  stopRecognition() {
    if (!this.ready) {
      return false;
    }

    if (this.isRecognitionActive) {
      this.isRecognitionActive = false;
      this.recognizer.stop();
    }
  }

  partlyRecognized(result) {
    if (!this.ready) {
      return false;
    }

    const e = new Event(EventNamesModel.PARTLY_RECOGNIZED);
    e.result = result;
    this.dispatchEvent(e);
  }

  fullyRecognized(result) {
    if (!this.ready) {
      return false;
    }

    const e = new Event(EventNamesModel.FULLY_RECOGNIZED);
    e.result = result;
    this.dispatchEvent(e);
  }
}

export default TranSpeech;