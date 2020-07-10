import Events from '../Types/Events.type';

class RuntimeEvent extends Event {
  public result: any;

  constructor(event: Events, result?: any) {
    super(event);

    if (typeof result !== undefined) {
      this.result = result;
    }
  }
}

export default RuntimeEvent;
