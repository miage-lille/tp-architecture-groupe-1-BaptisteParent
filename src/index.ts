#!/usr/bin/env node
import { BookSeat } from './use-cases/book-seat';

const bookSeat = new BookSeat(participationRepository, webinarRepository);

// Example usage
await bookSeat.execute('webinarId', 'userId').catch(error => console.error(error));
