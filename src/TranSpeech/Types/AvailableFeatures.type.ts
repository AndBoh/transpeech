type AvailableFeatures = {
  recognition?: SpeechRecognition | boolean;
  fetch?: (url: RequestInfo) => Promise<Response> | boolean;
  synthesis?: SpeechSynthesis | boolean;
  mediaDevices?: MediaDevices | boolean;
  permissions?: Permissions | boolean;
};

export default AvailableFeatures;
