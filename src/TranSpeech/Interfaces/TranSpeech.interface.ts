import AvailableFeatures from './../Types/AvailableFeatures.type';
import Voice from './../../Voice/classes/Voice.class';
import Events from '../../Events/Types/Events.type';

interface ITranSpeech {
  ready: boolean;
  availableFeatures: AvailableFeatures;
  activeVoice: Voice;
  isRecognitionActive: boolean;
  voices: Voice[];
  permissionStatus: string;
  recognitionLang: string;
  on(event: Events, handler: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
  requestPermission(request: MediaStreamConstraints): Promise<MediaStream>;
  setActiveVoice(voiceId: number | string): Voice | false;
  speak(text: string): void;
  translate(text: string, lang: string): Promise<string | false>;
  startRecognition(): void;
  stopRecognition(): void;
}

export default ITranSpeech;
