import ITranSpeech from '../Interfaces/TranSpeech.interface';
import AvailableFeatures from './../Types/AvailableFeatures.type';
import Errors from '../../Errors/Models/Errors.model';
import Events from '../../Events/Types/Events.type';
import RuntimeEvent from '../../Events/Classes/RuntimeEvent.class';
import Voice from './../../Voice/classes/Voice.class';

import {
  defaultFeatures,
  recognizerDefaults,
  permissionsQueryDefault,
  mediaStreamConstraintsDefault,
  googleRequersDefaults,
} from './Constants';

declare global {
  interface Window {
    speechRecognition: SpeechRecognition;
    webkitSpeechRecognition: SpeechRecognition;
  }
}

class TranSpeech implements ITranSpeech {
  public ready: boolean;
  public availableFeatures: AvailableFeatures;
  public activeVoice: Voice;
  public isRecognitionActive: boolean;
  public voices: Voice[];
  public permissionStatus: string;
  private recognizer: SpeechRecognition;
  private fetch: (url: URL) => Promise<Response>;
  private mediaDevices: MediaDevices;
  private permissions: Permissions;
  private synthesizer: SpeechSynthesis;
  private silent: boolean;
  private eventTarget: EventTarget;
  private mediaStream: MediaStream;

  constructor(silent?: boolean);
  constructor(features?: AvailableFeatures, silent?: boolean);
  constructor(param1?: any, param2?: any) {
    this.eventTarget = new EventTarget();
    this.isRecognitionActive = false;

    let features: AvailableFeatures;

    if (typeof param1 !== 'undefined' && typeof param2 !== 'undefined') {
      features = defaultFeatures;
      this.silent = false;
    } else if (typeof param2 !== 'undefined') {
      features = { ...defaultFeatures, ...param1 };
      this.silent = param2;
    } else if (typeof param1 === 'boolean') {
      features = defaultFeatures;
      this.silent = param1;
    } else {
      features = { ...defaultFeatures, ...param1 };
      this.silent = false;
    }

    this.ready = this.detectFeatures(features);

    if (!this.ready) {
      if (!this.silent) {
        Errors.InstanceNotCreated.throw();
      }
      return undefined;
    }

    this.recognizer = { ...this.recognizer, ...recognizerDefaults };

    Promise.all([
      this.getVoices()
        .then((voices) => {
          this.voices = voices;
          this.activeVoice = voices[0];
          this.dispatch(Events.VoicesReady);
        })
        .catch(() => {
          if (features.synthesis) {
            if (!this.silent) {
              Errors.UnableGetVoices.throw();
              Errors.InstanceNotCreated.throw();
            }
            return undefined;
          }
        }),
      this.getPermissionStatus()
        .then((permissionStatus) => {
          this.permissionStatus = permissionStatus.state;
          this.dispatch(Events.PermissionStatusReady);
        })
        .catch(() => {
          if (!this.silent) {
            Errors.NotSupportPermissions.throw();
            Errors.InstanceNotCreated.throw();
          }
          return undefined;
        }),
    ]).then(() => {
      this.dispatch(Events.Ready);
    });

    this.recognizer.onresult = (event) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        this.fullyRecognized(result[0].transcript);
      } else {
        this.partlyRecognized(result[0].transcript);
      }
    };
  }

  private dispatch(event: Events, result?: any): void {
    this.eventTarget.dispatchEvent(new RuntimeEvent(event, result));
  }

  public on(event: Events, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
    this.eventTarget.addEventListener(event, handler, options);
  }

  private detectFeatures(features: AvailableFeatures): boolean {
    const availableFeatures = TranSpeech.availableFeatures;

    if (features.fetch && !availableFeatures.fetch) {
      if (!this.silent) {
        Errors.NotSupportFetch.throw();
      }
      return false;
    } else if (availableFeatures.fetch) {
      this.fetch = (availableFeatures.fetch as () => Promise<Response>).bind(self as Window);
    }

    if (features.mediaDevices && !availableFeatures.mediaDevices) {
      if (!this.silent) {
        Errors.NotSupportMedia.throw();
      }
      return false;
    } else if (availableFeatures.mediaDevices) {
      this.mediaDevices = availableFeatures.mediaDevices as MediaDevices;
    }

    if (features.permissions && !availableFeatures.permissions) {
      if (!this.silent) {
        Errors.NotSupportPermissions.throw();
      }
      return false;
    } else if (availableFeatures.permissions) {
      this.permissions = availableFeatures.permissions as Permissions;
    }

    if (features.recognition && !availableFeatures.recognition) {
      if (!this.silent) {
        Errors.NotSupportRecognition.throw();
      }
      return false;
    } else if (availableFeatures.recognition) {
      this.recognizer = new (availableFeatures.recognition as any)();
    }

    if (features.synthesis && !availableFeatures.synthesis) {
      if (!this.silent) {
        Errors.NotSupportSynthesis.throw();
      }
      return false;
    } else if (availableFeatures.synthesis) {
      this.synthesizer = availableFeatures.synthesis as SpeechSynthesis;
    }

    return true;
  }

  public static get availableFeatures(): AvailableFeatures {
    return {
      recognition: self.speechRecognition || self.webkitSpeechRecognition,
      fetch: self.fetch,
      synthesis: self.speechSynthesis,
      mediaDevices: self.navigator?.mediaDevices,
      permissions: self.navigator?.permissions,
    };
  }

  private async getVoices(): Promise<Voice[]> {
    let timer: number;
    let tryCount = 0;
    return new Promise((resolve, reject) => {
      timer = setInterval(() => {
        if (tryCount >= 100) {
          clearInterval(timer);
          reject();
        }

        const browserVoices = this.synthesizer.getVoices();
        if (browserVoices?.length) {
          clearInterval(timer);
          resolve(browserVoices.map((voice, index) => new Voice(index, voice)));
        }

        tryCount += 1;
      }, 10);
    });
  }

  private async getPermissionStatus(
    query: DevicePermissionDescriptor = permissionsQueryDefault,
  ): Promise<PermissionStatus> {
    return this.permissions.query(query);
  }

  public async requestPermission(
    request: MediaStreamConstraints = mediaStreamConstraintsDefault,
  ): Promise<MediaStream> {
    try {
      this.mediaStream = await this.mediaDevices.getUserMedia(request);
      this.getPermissionStatus();
      return this.mediaStream;
    } catch (e) {
      if (!this.silent) {
        Errors.PermissionDeclined.throw();
      }
    }
  }

  public setActiveVoice(voiceId: number | string): Voice | false {
    let voice: Voice;

    if (typeof voiceId === 'number') {
      voice = this.voices.find((v) => v.id === voiceId);
    } else {
      voice = this.voices.find(
        (v) =>
          v.name.toLocaleLowerCase().includes(voiceId.toLocaleLowerCase()) ||
          v.lang.toLocaleLowerCase().includes(voiceId.toLocaleLowerCase()),
      );
    }

    if (!voice) {
      if (!this.silent) {
        Errors.WrongVoice.throw();
        if (!(self as Window).navigator.onLine) {
          Errors.DueToOffline.throw();
        }
      }
    }

    this.activeVoice = voice;
    return voice;
  }

  public get recognitionLang(): string {
    return this.recognizer.lang;
  }

  public set recognitionLang(lang) {
    this.recognizer.lang = lang;
  }

  public speak(text: string): void {
    if (!text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.activeVoice.voice;
    this.synthesizer.speak(utterance);
  }

  public async translate(text: string, lang: string): Promise<string | false> {
    if (!text) {
      if (!this.silent) {
        Errors.NothingToTranslate.throw();
      }
      return false;
    }
    if (!lang) {
      if (!this.silent) {
        Errors.WrongLanguage.throw();
      }
      return false;
    }
    if (!(self as Window).navigator.onLine) {
      if (!this.silent) {
        Errors.TranslationUnavilable.throw();
        Errors.DueToOffline.throw();
      }
      return false;
    }

    const url = new URL(googleRequersDefaults.url);
    url.search = new URLSearchParams({
      ...googleRequersDefaults.params,
      tl: lang,
      q: text,
    }).toString();

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        if (!this.silent) {
          Errors.TranslationError.throw();
        }
        return false;
      }

      const translatedText = await response.json();

      if (!translatedText[0]) {
        if (!this.silent) {
          Errors.NothingToTranslate.throw();
        }
        return false;
      }

      return translatedText[0][0][0];
    } catch (e) {
      if (!this.silent) {
        Errors.TranslationError.throw();
      }
      return false;
    }
  }

  public startRecognition(): void {
    if (this.permissionStatus !== 'granted') {
      if (!this.silent) {
        Errors.PermissionDeclined.throw();
      }
      return;
    }

    if (this.isRecognitionActive) {
      if (!this.silent) {
        Errors.RecognitionActive.throw();
      }
      return;
    }

    this.isRecognitionActive = true;
    this.recognizer.start();
  }

  public stopRecognition(): void {
    if (this.isRecognitionActive) {
      this.isRecognitionActive = false;
      this.recognizer.stop();
    }
  }

  private partlyRecognized(result: string): void {
    this.dispatch(Events.PartlyRecognized, result);
  }

  private fullyRecognized(result: string): void {
    this.dispatch(Events.FullyRecognized, result);
  }
}

export default TranSpeech;
