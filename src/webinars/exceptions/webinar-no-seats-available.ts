export class WebinarNoSeatsAvailableException extends Error {
  constructor() {
    super('No seats available');
    this.name = 'WebinarNoSeatsAvailableException';
  }
}
