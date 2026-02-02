import { FixedIdGenerator } from 'src/core/adapters/fixed-id-generator';
import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { IMailer } from 'src/core/ports/mailer.interface';
import { IIdGenerator } from 'src/core/ports/id-generator.interface';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { InMemoryParticipationRepository } from 'src/webinars/adapters/participation-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { BookSeat } from 'src/webinars/use-cases/book-seat';
import { OrganizeWebinars } from 'src/webinars/use-cases/organize-webinar';
import { FixedDateGenerator } from 'src/core/adapters/fixed-date-generator';
import { IDateGenerator } from 'src/core/ports/date-generator.interface';

describe('Feature: Book seat', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let participationRepository: InMemoryParticipationRepository;
  let mailer: IMailer;
  let useCase: BookSeat;
  let userRepository: IUserRepository;

  const alice: User = new User({
    id: 'user-alice-id',
    email: 'alice@example.com',
    password: 'password123',
  });

  const bob: User = new User({
    id: 'user-bob-id',
    email: 'bob@example.com',
    password: 'password456',
  });

  beforeEach(async () => {
    webinarRepository = new InMemoryWebinarRepository();
    participationRepository = new InMemoryParticipationRepository();
    mailer = new InMemoryMailer();
    userRepository = {} as IUserRepository;
    useCase = new BookSeat(participationRepository, userRepository, webinarRepository, mailer);

    // Link participation repository to webinar repository so it can query participants
    webinarRepository = new InMemoryWebinarRepository(
      webinarRepository.database,
      participationRepository,
    );
    useCase = new BookSeat(participationRepository, userRepository, webinarRepository, mailer);

    // Create a webinar
    const idGenerator: IIdGenerator = new FixedIdGenerator();
    const dateGenerator: IDateGenerator = new FixedDateGenerator();
    const organizeWebinar = new OrganizeWebinars(webinarRepository, idGenerator, dateGenerator);

    await organizeWebinar.execute({
      userId: 'user-organizer-id',
      title: 'Test Webinar',
      seats: 100,
      startDate: new Date('2024-01-10T10:00:00.000Z'),
      endDate: new Date('2024-01-10T11:00:00.000Z'),
    });
  });

  describe('Scenario: happy path', () => {
    it('should add a participant to the webinar', async () => {
      await useCase.execute({
        webinarId: 'id-1',
        user: alice,
      });

      const participations = await participationRepository.findByWebinarId('id-1');
      expect(participations).toHaveLength(1);
      expect(participations[0].props.userId).toBe('user-alice-id');
    });

    it('should send an email to the organizer', async () => {
      await useCase.execute({
        webinarId: 'id-1',
        user: alice,
      });

      expect((mailer as InMemoryMailer).sentEmails).toHaveLength(1);
      expect((mailer as InMemoryMailer).sentEmails[0]).toEqual({
        to: 'user-organizer-id',
        subject: 'New participant for Test Webinar',
        body: 'A new participant has registered for your webinar "Test Webinar"',
      });
    });
  });

  describe('Scenario: user is already participating', () => {
    it('should throw an error', async () => {
      await useCase.execute({
        webinarId: 'id-1',
        user: alice,
      });

      await expect(
        useCase.execute({
          webinarId: 'id-1',
          user: alice,
        }),
      ).rejects.toThrow('User already participating in this webinar');
    });

    it('should not send a second email', async () => {
      await useCase.execute({
        webinarId: 'id-1',
        user: alice,
      });

      // eslint-disable-next-line no-empty
      try {
        await useCase.execute({
          webinarId: 'id-1',
          user: alice,
        });
      } catch (error) {}

      expect((mailer as InMemoryMailer).sentEmails).toHaveLength(1);
    });
  });

  describe('Scenario: no seats available', () => {
    beforeEach(async () => {
      // Create a webinar with only 1 seat directly in the repository to avoid ID conflicts
      const webinar = new Webinar({
        id: 'id-2',
        organizerId: 'user-organizer-id',
        title: 'Limited Webinar',
        startDate: new Date('2024-01-10T10:00:00.000Z'),
        endDate: new Date('2024-01-10T11:00:00.000Z'),
        seats: 1,
      });
      await webinarRepository.create(webinar);

      // Add alice to fill the only seat
      await useCase.execute({
        webinarId: 'id-2',
        user: alice,
      });
    });

    it('should throw an error when no seats are available', async () => {
      await expect(
        useCase.execute({
          webinarId: 'id-2',
          user: bob,
        }),
      ).rejects.toThrow('No seats available');
    });

    it('should not send an email when booking fails', async () => {
      const emailCountBefore = (mailer as InMemoryMailer).sentEmails.length;

      // eslint-disable-next-line no-empty
      try {
        await useCase.execute({
          webinarId: 'id-2',
          user: bob,
        });
      } catch (error) {}

      expect((mailer as InMemoryMailer).sentEmails).toHaveLength(emailCountBefore);
    });
  });
});
