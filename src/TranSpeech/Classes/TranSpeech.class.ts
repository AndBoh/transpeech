import ITranSpeech from '../Interfaces/TranSpeech.interface';
import AvailableFeatures from './../Types/AvailableFeatures.type';
import Errors from '../../Errors/Models/Errors.model';
import Events from '../../Events/Types/Events.type';
import RuntimeEvent from '../../Events/Classes/RuntimeEvent.class';
import Voice from './../../Voice/classes/Voice.class';
import RuntimeError from './../../Errors/Classes/RuntimeError.class';

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

  constructor(features?: AvailableFeatures & { silent: boolean }){
    this.eventTarget = new EventTarget();
    this.isRecognitionActive = false;

    features = {
      ...defaultFeatures,
      ...features,
    }

    this.silent = features.silent;

    this.ready = this.detectFeatures(features);

    if (!this.ready) {
      this.throw(Errors.InstanceNotCreated);
      return undefined;
    }

    if (features.recognition) {
      this.recognizer = { 
        ...this.recognizer,
        ...recognizerDefaults,
      };

      this.recognizer.onresult = (event) => {
        const result = event.results[event.resultIndex];
        if (result.isFinal) {
          this.fullyRecognized(result[0].transcript);
        } else {
          this.partlyRecognized(result[0].transcript);
        }
      };
    }

    Promise.all([
      new Promise((resolve, reject) => {
        if (features.synthesis) {
          this.getVoices()
            .then((voices) => {
              this.voices = voices;
              this.activeVoice = voices[0];
              this.dispatch(Events.VoicesReady);
              resolve();
            })
            .catch(() => {
              this.throw(Errors.UnableGetVoices);
              reject();
            });
        } else {
          resolve();
        }
      }),
      new Promise((resolve, reject) => {
        if (features.recognition) {
          this.getPermissionStatus()
            .then((permissionStatus) => {
              this.permissionStatus = permissionStatus.state;
              this.dispatch(Events.PermissionStatusReady);
            })
            .catch(() => {
              this.throw(Errors.NotSupportPermissions);
              reject();
            })
        } else {
          resolve();
        }
      })
    ])
    .then(() => {
      this.dispatch(Events.Ready)
    })
    .catch(() => {
      this.throw(Errors.InstanceNotCreated);
      return undefined;
    });
    }

  private dispatch(event: Events, result?: any): void {
    this.eventTarget.dispatchEvent(new RuntimeEvent(event, result));
  }

  public on(event: Events, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void {
    this.eventTarget.addEventListener(event, handler, options);
  }

  private throw(error: RuntimeError) {
    if (!this.silent) {
      error.throw();
    }
  }

  private detectFeatures(features: AvailableFeatures): boolean {
    const availableFeatures = TranSpeech.availableFeatures;

    if (features.translation) {
      if (availableFeatures.translation) {
        this.fetch = (self.fetch as () => Promise<Response>).bind(self)
      } else {
        this.throw(Errors.NotSupportFetch);
        return false;
      }
    }

    if (features.synthesis) {
      if (availableFeatures.synthesis) {
        this.synthesizer = self.speechSynthesis as SpeechSynthesis;
      } else {
        this.throw(Errors.NotSupportSynthesis);
        return false;
      }
    }

    if (features.recognition) {
      if (availableFeatures.recognition) {
        this.recognizer = new ((self.speechRecognition || self.webkitSpeechRecognition) as any)();
        this.permissions = self.navigator?.permissions;
        this.mediaDevices = self.navigator?.mediaDevices;
      } else {
        this.throw(Errors.NotSupportRecognition);
        return false;
      }
    }

    return true;
  }

  public static get availableFeatures(): AvailableFeatures {
    return {
      recognition: !!(
        (self.speechRecognition || self.webkitSpeechRecognition)
        && self.navigator?.mediaDevices
        && self.navigator?.permissions
      ),
      translation: !!self.fetch,
      synthesis: !!self.speechSynthesis,
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
