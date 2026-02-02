import { Webinar } from 'src/webinars/entities/webinar.entity';

type WebinarDetails = {
  id: string;
  organizerId: string;
  title: string;
  maxParticipants: number;
  participants: { userId: string }[];
};

export interface IWebinarRepository {
  create(webinar: Webinar): Promise<void>;
  getWebinarDetails(webinarId: string): Promise<WebinarDetails | null>;
}
