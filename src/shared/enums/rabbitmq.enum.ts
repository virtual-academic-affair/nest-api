export enum EmailRoutingKey {
  Ingested = 'ingested',
  Labeled = 'labeled',

  // Specific routing keys per system label for business processing
  ClassRegistration = 'processed.classRegistration',
  Task = 'processed.task',
  Inquiry = 'processed.inquiry',
}

const PREFIX_QUEUE = 'queue.';

// Queue names for consumers
export const QUEUE_LABELED = PREFIX_QUEUE + EmailRoutingKey.Labeled;
export const QUEUE_CLASS_REGISTRATION =
  PREFIX_QUEUE + EmailRoutingKey.ClassRegistration;
export const QUEUE_TASK = PREFIX_QUEUE + EmailRoutingKey.Task;
export const QUEUE_INQUIRY = PREFIX_QUEUE + EmailRoutingKey.Inquiry;
