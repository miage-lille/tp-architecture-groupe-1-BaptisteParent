import { Participation } from 'src/webinars/entities/participation.entity';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';

export class InMemoryParticipationRepository implements IParticipationRepository {
  constructor(public database: Participation[] = []) {}

  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    return this.database.filter((p) => p.props.webinarId === webinarId);
  }

  async save(participation: Participation): Promise<void> {
    this.database.push(participation);
  }

  async isUserRegisteredForWebinar(webinarId: string, userId: string): Promise<boolean> {
    return this.database.some(
      (p) => p.props.webinarId === webinarId && p.props.userId === userId,
    );
  }

  async addParticipant(webinarId: string, userId: string): Promise<void> {
    const participation = new Participation({
      userId,
      webinarId,
    });
    await this.save(participation);
  }
}
