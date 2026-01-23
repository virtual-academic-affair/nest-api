export enum EmailRoutingKey {
  Ingested = 'email.ingested',
  NlpLabeled = 'email.nlp.labeled',
  NlpProcessed = 'email.nlp.processed',
}

export const QUEUE_PREFIX = 'queue.email.';
export const QUEUE_NLP_LABELED = 'queue.email.nlp.labeled';
export const QUEUE_CLASS_REGISTRATION =
  'queue.class-registration.nlp.processed';
