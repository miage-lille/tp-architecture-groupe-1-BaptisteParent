import { Participation } from 'src/webinars/entities/participation.entity';

export interface IParticipationRepository {
  findByWebinarId(webinarId: string): Promise<Participation[]>;
  save(participation: Participation): Promise<void>;
  isUserRegisteredForWebinar(webinarId: string, userId: string): Promise<boolean>;
  addParticipant(webinarId: string, userId: string): Promise<void>;
}
