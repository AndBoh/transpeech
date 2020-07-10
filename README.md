# TranSpeech

**TranSpeech** is a small voice and text library. It allows you to recognize and synthesize speech using a browser, and translate text.

## Limitations

TranSpeech uses modern browser api in its work and may have compatibility problems. You can check the compatibility with the browsers at the following links:

[Speech Recognition API](https://caniuse.com/#feat=speech-recognition)

[Speech Synthesis API](https://caniuse.com/#feat=speech-synthesis)

[Fetch API](https://caniuse.com/#feat=fetch)

The library also uses the free version of Google Translate API, which allows you to translate only small passages of text, such as sentences. If you need more functionality, in accordance with the MIT license, you can change the library code to fit your needs.

**Starting from version 1.0.0, you can get a list of supported features before creating an instance using the static property ```availableFeatures```. If the field of the received object is not negative, the browser supports this functionality.**

## Install
```
npm install --save transpeech
```

## Usage

First you need to import the library into your script.

```js
import TranSpeech from 'transpeech';
```
Then you need to create an instance of the class. You can pass an object with the necessary functionality to the constructor. The object is similar to the object returned by the ```availableFeatures``` method.

For example, if the browser does not support speech recognition, you can use the following code:
```js
const ts = new TranSpeech({ recognition: false });
```
If the settings object is not passed, all features will be requested.

You can also pass the parameter ```silent```. If it is positive, all messages to the browser console will be disabled.

## API

### Properties

#### ready

It is ```true``` if the class constructor completed successfully, and an instance is ready for use.

```js
if (ts.ready) {
  // your code here
}
```

#### permissionStatus

Stores the permission status of access to the media device (e.g. microphone). Possible values: `'granted', 'denied', 'prompt'`.

```js
console.log(ts.permissionStatus); // 'prompt'
```

#### voices

Contains an array of available voices for the Speech Synthesis API. Each voice object contains the following fields:
```js
Number id // Voice ID
String name // Voice name
String lang // Languade code
Boolean offline // True if this voice available offline
```

[Language codes](https://cloud.google.com/translate/docs/languages)

```js
console.log(ts.voices[0]);

// {
//   id: 0
//   name: "Microsoft David Desktop - English (United States)"
//   lang: "en-US"
//   offline: true
// }
```

#### activeVoice

Returns a voice object that is selected as ative.

```js
console.log(ts.activeVoice); 

// {
//   id: 5
//   name: "Google UK English Female"
//   lang: "en-GB"
//   offline: false
// }
```

#### isRecognitionActive

```true``` if recognition is active right now and ```false``` otherwise.

```js
if (ts.isRecognitionActive) {
  // your code here
}
```

#### recognitionLang

Used to get and set the language of recognized speech.

```js
ts.recognitionLang = 'en';
```

### Methods

#### requestPermission()

##### Parameters
```
MediaStreamConstraints request
```

Asks the user for permission to access the microphone (by default) or other device. Can be used without params. Returns the promise that is resolved to the [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) object, if the user gives permission.

```js
ts.requestPermission().then((mediaStream) => {
  console.log(ts.permissionStatus); // 'granted'
  // Do something with mediaStream
});
```

#### setActiveVoice(voiceId)

##### Parameters

```js
Number | String voiceId // Voice ID, Voice lang code or part of a Voice Name
```

Sets the voice object as active. It can accept an ID (Number), a language code or its part (String), or part of a voice name (String). Returns false if a voice with such parameters was not found.

```js
ts.setActiveVoice('gb');
console.log(ts.activeVoice);

// {
//   id: 5
//   name: "Google UK English Female"
//   lang: "en-GB"
//   offline: false
// }
```

#### speak(text)

##### Parameters

```js
String text // The text to be synthesized
```

Synthesizes text with an active voice.

```js
ts.speak('Hello world');
```

#### translate(text, lang)

##### Parameters

```js
String text // The text to be translated
String lang // Lang code
```

Returns a promise that resolves to a string containing the translated text.


```js
ts.translate('Hello', 'es').then(result => {
  console.log(result);
});

// Hola
```

#### startRecognition()

##### Parameters

```js
none
```

Starts voice recognition.

```js
ts.startRecognition();
console.log(isRecognitionActive); // true
```

#### stopRecognition()

##### Parameters

```js
none
```

Stops voice recognition.

```js
ts.stopRecognition();
console.log(isRecognitionActive); // false
```

### Events

Import the event list as follows.

```js
import { Events } from 'transpeech';
```

#### VoicesReady

The constructor receives available voices asynchronously. The event fires when voices are received.

```js
ts.on(Events.VoicesReady, () => {
  console.log(ts.voices[0]);
});
```

#### PermissionStatusReady

Event fires when browser permissions are received.

```js
ts.on(Events.PermissionStatusReady, () => {
  console.log(ts.permissionStatus);
});
```

#### Ready

Event fires when everything is prepared and the instance is fully ready for use.

```js
const ts = new TranSpeech();

ts.on(Events.Ready, () => {
  // Any code here
});
```

#### PartlyRecognized

Fires when a sentence is partially recognized.

```js
ts.on(Events.PartlyRecognized, (result) => {
  console.log(result);
});
```

#### FullyRecognized

Fires when a sentence is fully recognized.

```js
ts.on(Events.FullyRecognized, (result) => {
  console.log(result);
});
```

# Author

**Andrey Bokhan** - [GitHub](https://github.com/AndBoh)

# License

This project is licensed under the [MIT License](https://github.com/AndBoh/transpeech/blob/master/LICENSE.md).