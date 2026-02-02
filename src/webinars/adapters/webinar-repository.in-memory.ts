import { Webinar } from 'src/webinars/entities/webinar.entity';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';

type WebinarDetails = {
  id: string;
  organizerId: string;
  title: string;
  maxParticipants: number;
  participants: { userId: string }[];
};

export class InMemoryWebinarRepository implements IWebinarRepository {
  constructor(
    public database: Webinar[] = [],
    private readonly participationRepository?: IParticipationRepository,
  ) {}

  async create(webinar: Webinar): Promise<void> {
    this.database.push(webinar);
  }

  async getWebinarDetails(webinarId: string): Promise<WebinarDetails | null> {
    const webinar = this.database.find((w) => w.props.id === webinarId);
    if (!webinar) {
      return null;
    }

    let participants: { userId: string }[] = [];
    if (this.participationRepository) {
      const participations = await this.participationRepository.findByWebinarId(webinarId);
      participants = participations.map((p) => ({ userId: p.props.userId }));
    }

    return {
      id: webinar.props.id,
      organizerId: webinar.props.organizerId,
      title: webinar.props.title,
      maxParticipants: webinar.props.seats,
      participants,
    };
  }
}
