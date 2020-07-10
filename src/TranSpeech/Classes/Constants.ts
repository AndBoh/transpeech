const defaultFeatures = {
  recognition: true,
  synthesis: true,
};

const recognizerDefaults = {
  continuous: true,
  interimResults: true,
  lang: 'en',
};

const permissionsQueryDefault: DevicePermissionDescriptor = {
  name: 'microphone',
};

const mediaStreamConstraintsDefault: MediaStreamConstraints = {
  audio: true,
};

const googleRequersDefaults = {
  url: 'https://translate.googleapis.com/translate_a/single',
  params: {
    client: 'gtx',
    sl: 'auto',
    dt: 't',
  },
};

export {
  defaultFeatures,
  recognizerDefaults,
  permissionsQueryDefault,
  mediaStreamConstraintsDefault,
  googleRequersDefaults,
};
