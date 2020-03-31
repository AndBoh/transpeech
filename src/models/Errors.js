import ErrorTypesModel from './ErrorTypes';

export default {
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
};
