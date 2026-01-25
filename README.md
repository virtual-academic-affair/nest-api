# Virtual Academic Affair API

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-9-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-4.7-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-FF6600?style=flat&logo=rabbitmq&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=flat&logo=docker&logoColor=white)

## Introduction

A system to support academic affairs management through automated email processing. The system:

- Syncs emails from Gmail to database
- Automatically classifies emails using NLP (Natural Language Processing)
- Auto-applies labels to emails on Gmail based on classification
- Routes emails to appropriate business modules for handling academic affairs

## Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Start services (PostgreSQL, RabbitMQ, Redis):**

```bash
docker-compose up -d
```

3. **Configure environment variables:**
    - Create `.env` file based on `.env.example`
    - Configure database, RabbitMQ, Google OAuth credentials

4. **Run application:**

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

5. **Access:**
    - API: http://localhost:3000
    - Postman: `src/*/http/`

## Email Processing Flow

```
1. Gmail API
   ↓ (Auto-sync every 5 minutes or manual trigger)
   
2. EmailSyncService
   - Fetch new emails from Gmail
   - Filter by policy (allowed admins/domains)
   ↓
   
3. RabbitMQ (email.ingested)
   - Publish message with email content
   ↓
   
4. NLP Service (External - Python)
   - Analyze email content
   - Classify and return SystemLabels + extracted business data
   ↓
   ├─────────────────────────────┬─────────────────────────────┐
   │                             │                             │
   │ Path A: Labeling            │ Path B: Business Processing │
   │                             │                             │
   ↓                             ↓                             ↓
   
5a. RabbitMQ (email.nlp.labeled)     5b. RabbitMQ (email.nlp.processed)
    - Receive classification              - Receive extracted business data
    ↓                                     ↓
    
6a. NlpLabeledService                6b. Business Modules (by SystemLabel)
    - Update SystemLabels in DB          - Each module processes extracted data
    - Apply labels to Gmail              and executes specific business logic
                                         
                                         
                                         
                                         
                                          
                                          
```
