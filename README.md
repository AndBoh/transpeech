# TranSpeech

**TranSpeech** is a small voice and text library. It allows you to recognize and synthesize speech using a browser, and translate text.

## Limitations

TranSpeech uses modern browser api in its work and may have compatibility problems. You can check the compatibility with the browsers at the following links:

[Speech Recognition API](https://caniuse.com/#feat=speech-recognition)

[Speech Synthesis API](https://caniuse.com/#feat=speech-synthesis)

[Fetch API](https://caniuse.com/#feat=fetch)

The library also uses the free version of Google Translate API, which allows you to translate only small passages of text, such as sentences. If you need more functionality, in accordance with the MIT license, you can change the library code to fit your needs.

## Install
```
npm install --save transpeech
```

## Usage

First you need to import the library into your script and create a TranSpeech instance.

```js
import TranSpeech from 'transpeech';

const ts = new TranSpeech();
```

During the launch of the constructor, the presence of all necessary APIs in the browser is checked. You can find out the result of the check using the flag:

```js
if (ts.ready) {...}
```

Also, in case of problems, you will see an error in the console.

Then, as early as possible in your code, call the method

```js
ts.init();
```

It will perform the necessary preparatory operations. It returns a promise, so if you want to immediately call other methods of the class, do it in the handler ```.then();```

```js
import TranSpeech from 'transpeech';

const ts = new TranSpeech();

if (ts.ready) {
  ts.init().then(() => {
  // your code here
});
}
```

## API

### Properties

#### ready

It is ```true``` if the class constructor completed successfully, and an instance is ready for use and ```false``` otherwise.

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

// Voice {
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

// Voice {
//   id: 5
//   name: "Google UK English Female"
//   lang: "en-GB"
//   offline: false
// }
```

#### isRecognitionActive

```true``` if recognition is active and ```false``` otherwise.

```js
if (ts.isRecognitionActive) {
  // your code here
}
```

### Methods

#### requestPermission()

##### Parameters
```js
none
```

Asks the user for permission to access the microphone. Returns the promise that is resolved to the [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) object, if the user gives permission.

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

// Voice {
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

#### setRecognitionLang(lang)

##### Parameters

```js
String lang // Lang code
```

Sets the language to be recognized.

```js
st.setRecognitionLang('es'); // Sets Spanish
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

#### partly-recognized

Fires when a sentence is partially recognized. Returns event with a result field.

```js
ts.addEventListener('partly-recognized', ({ result }) => {
  console.log(result);
});
```

#### recognized

Fires when a sentence is fully recognized. Returns event with a result field.

```js
ts.addEventListener('recognized', ({ result }) => {
  console.log(result);
});
```

# Author

**Andrey Bokhan** - [GitHub](https://github.com/AndBoh)

# License

This project is licensed under the [MIT License](https://github.com/AndBoh/transpeech/blob/master/LICENSE.md).