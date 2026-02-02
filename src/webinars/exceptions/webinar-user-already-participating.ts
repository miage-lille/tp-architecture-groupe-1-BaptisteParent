export class WebinarUserAlreadyParticipatingException extends Error {
  constructor() {
    super('User already participating in this webinar');
    this.name = 'WebinarUserAlreadyParticipatingException';
  }
}
