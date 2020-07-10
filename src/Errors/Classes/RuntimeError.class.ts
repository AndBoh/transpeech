import IRuntimeError from '../Interfaces/RuntimeError.interface';
import ErrorType from '../Types/ErrorType.type';

class RuntimeError implements IRuntimeError {
  private readonly type: ErrorType;
  private readonly message: string;

  constructor(type: ErrorType, message: string) {
    this.type = type;
    this.message = message;
  }

  public throw(): void {
    const message = `[TranSpeech ${this.type}]: ${this.message}`;
    console[this.type](message);
  }
}

export default RuntimeError;
