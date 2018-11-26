/**
 * service module
 */
import * as chevre from '@chevre/domain';

export import aggregation = chevre.service.aggregation;
export import offer = chevre.service.offer;
export import task = chevre.service.task;
export import transaction = chevre.service.transaction;

import * as EventService from './service/event';

export import event = EventService;
