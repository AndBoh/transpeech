class Voice {
  constructor(id, speechSynthesisVoice) {
    this.id = id;
    this.name = speechSynthesisVoice.name;
    this.lang = speechSynthesisVoice.lang;
    this.voice = speechSynthesisVoice;
    this.offline = speechSynthesisVoice.localService;
  }
}

export default Voice;
