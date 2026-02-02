import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { WebinarNoSeatsAvailableException } from 'src/webinars/exceptions/webinar-no-seats-available';
import { WebinarUserAlreadyParticipatingException } from 'src/webinars/exceptions/webinar-user-already-participating';

type Request = {
  webinarId: string;
  user: User;
};

export class BookSeat implements Executable<Request, void> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}
  async execute({ webinarId, user }: Request): Promise<void> {
    const webinar = await this.webinarRepository.getWebinarDetails(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    if (webinar.participants.length >= webinar.maxParticipants) {
      throw new WebinarNoSeatsAvailableException();
    }

    const alreadyParticipating = await this.participationRepository.isUserRegisteredForWebinar(webinarId, user.id);
    if (alreadyParticipating) {
      throw new WebinarUserAlreadyParticipatingException();
    }

    await this.participationRepository.addParticipant(webinarId, user.id);
    
    // Send email to organizer (side-effect)
    await this.mailer.send({
      to: webinar.organizerId,
      subject: `New participant for ${webinar.title}`,
      body: `A new participant has registered for your webinar "${webinar.title}"`,
    });
  }
}
