# Virtual Academic Affair API

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-FF6600?style=flat&logo=rabbitmq&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-24-2496ED?style=flat&logo=docker&logoColor=white)

## Package Information

- Name: `nestjs-auth-starter`
- Version: `0.0.1`
- License: `UNLICENSED`
- Runtime: `Node.js 18+`

## Introduction

This project is a NestJS-based backend platform for academic affairs operations that ingests institutional email traffic, routes requests into business modules, and supports automated classification and response workflows.

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
   - Postman Collections: `http/` (root directory)

##

![Flowchart](./public/flowchart.svg)
