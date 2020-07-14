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
      this.recognizer.continuous = recognizerDefaults.continuous;
      this.recognizer.interimResults = recognizerDefaults.interimResults;
      this.recognizer.lang = recognizerDefaults.lang;

      this.recognizer.onresult = (event) => {
        const result = event.results[event.resultIndex];
        if (result.isFinal) {
          this.fullyRecognized(result[0].transcript);
        } else {
          this.partlyRecognized(result[0].transcript);
        }
        this.isRecognitionActive = false;
      };
    }

    Promise.all([
      new Promise((resolve, reject) => {
        if (features.synthesis) {
          this.getVoices()
            .then((voices) => {
              this.voices = voices;
              this.activeVoice = voices[0];
              this.dispatch(Events.VoicesReady, this.voices);
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
              this.dispatch(Events.PermissionStatusReady, this.permissionStatus);
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
      this.dispatch(Events.Ready);
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
        this.recognizer = new ((self.webkitSpeechRecognition || self.speechRecognition) as any)();
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
      this.permissionStatus = (await this.getPermissionStatus()).state;
      return this.mediaStream;
    } catch (e) {
      this.permissionStatus = 'denied';
      this.throw(Errors.PermissionDeclined);
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
      this.throw(Errors.WrongVoice);
      if (!(self as Window).navigator.onLine) {
        this.throw(Errors.DueToOffline);
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
      this.throw(Errors.NothingToTranslate);
      return false;
    }
    if (!lang) {
      this.throw(Errors.WrongLanguage);
      return false;
    }
    if (!(self as Window).navigator.onLine) {
      this.throw(Errors.TranslationUnavilable);
      this.throw(Errors.DueToOffline);
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
        this.throw(Errors.TranslationError);
        return false;
      }

      const translatedText = await response.json();

      if (!translatedText[0]) {
        this.throw(Errors.NothingToTranslate);
        return false;
      }

      return translatedText[0][0][0];
    } catch (e) {
      this.throw(Errors.TranslationError);
      return false;
    }
  }

  public startRecognition(): void {
    if (this.permissionStatus !== 'granted') {
      this.throw(Errors.PermissionDeclined);
      return;
    }

    try {
      this.isRecognitionActive = true;
      this.recognizer.start();
    } catch (error) {
      this.throw(Errors.RecognitionActive);
    }
    
  }

  public stopRecognition(): void {
    this.isRecognitionActive = false;
    this.recognizer.stop();
  }

  private partlyRecognized(result: string): void {
    this.dispatch(Events.PartlyRecognized, result);
  }

  private fullyRecognized(result: string): void {
    this.dispatch(Events.FullyRecognized, result);

    if (!this.recognizer.continuous) {
      this.isRecognitionActive = false;
    }
  }
}

export default TranSpeech;
