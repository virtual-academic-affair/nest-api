export enum RoutingKey {
  Ingested = 'ingested',
  Labeled = 'labeled',

  // Specific routing keys per system label for business processing
  ClassRegistration = 'processed.classRegistration',
  Task = 'processed.task',
  Inquiry = 'processed.inquiry',
}

export enum QueueName {
  Labeled = 'queue.labeled',
  ClassRegistration = 'queue.processed.classRegistration',
  Task = 'queue.processed.task',
  Inquiry = 'queue.processed.inquiry',
}
