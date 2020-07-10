import IVoice from './../interfaces/Voice.interface';

class Voice implements IVoice {
  public readonly id: number;
  public readonly name: string;
  public readonly lang: string;
  public readonly offline: boolean;
  public readonly voice: SpeechSynthesisVoice;

  constructor(id: number, voice: SpeechSynthesisVoice) {
    this.id = id;
    this.name = voice.name;
    this.lang = voice.lang;
    this.offline = voice.localService;
    this.voice = voice;
  }
}

export default Voice;
