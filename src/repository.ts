// tslint:disable:max-classes-per-file completed-docs
/**
 * リポジトリー
 */
import * as chevre from '@chevre/domain';

export import AccountTitle = chevre.repository.AccountTitle;
export import Action = chevre.repository.Action;
export import CreativeWork = chevre.repository.CreativeWork;
export import Place = chevre.repository.Place;
export import PriceSpecification = chevre.repository.PriceSpecification;
export import Reservation = chevre.repository.Reservation;
export import ReservationNumber = chevre.repository.ReservationNumber;
export import ServiceType = chevre.repository.ServiceType;
export import Task = chevre.repository.Task;
export import TicketType = chevre.repository.TicketType;
export import Transaction = chevre.repository.Transaction;
export import itemAvailability = chevre.repository.itemAvailability;

import { MongoRepository as BoxOfficeTypeRepo } from './repo/boxOfficeType';
import { MongoRepository as DistributionsRepo } from './repo/distributions';
import { MongoRepository as EventRepo } from './repo/event';
import { MongoRepository as SubjectRepo } from './repo/subject';

export class BoxOfficeType extends BoxOfficeTypeRepo { }
export class Event extends EventRepo { }
export class Distributions extends DistributionsRepo { }
export class Subject extends SubjectRepo { }
