import RuntimeError from '../Classes/RuntimeError.class';
import ErrorType from '../Types/ErrorType.type';

const Errors = {
  // Errors
  NotSupportRecognition: new RuntimeError(ErrorType.Error, 'This browser does not support Speech Recognition feature.'),
  NotSupportSynthesis: new RuntimeError(ErrorType.Error, 'This browser does not support Speech Synthesis feature.'),
  NotSupportFetch: new RuntimeError(ErrorType.Error, 'This browser does not support Fetch feature.'),
  NotSupportMedia: new RuntimeError(ErrorType.Error, 'This browser does not support Media Devices feature.'),
  NotSupportPermissions: new RuntimeError(ErrorType.Error, 'This browser does not support Permissions feature.'),
  InstanceNotCreated: new RuntimeError(ErrorType.Error, 'Instance was not created.'),
  UnableGetVoices: new RuntimeError(ErrorType.Error, 'Unable to get voices.'),
  // Warnings
  WrongVoice: new RuntimeError(ErrorType.Warn, 'Wrong Voice ID.'),
  TranslationUnavilable: new RuntimeError(ErrorType.Warn, 'Transtalion is unavailable.'),
  TranslationError: new RuntimeError(ErrorType.Warn, 'Transtalion service error.'),
  DueToOffline: new RuntimeError(ErrorType.Warn, "This could be due to the fact that you're offline."),
  PermissionDeclined: new RuntimeError(ErrorType.Warn, 'User did not give permission.'),
  RecognitionActive: new RuntimeError(ErrorType.Warn, 'Recognition already active.'),
  NothingToTranslate: new RuntimeError(ErrorType.Warn, 'Nothing to translate.'),
  WrongLanguage: new RuntimeError(ErrorType.Warn, 'Wrong translation language.'),
};

export default Errors;
