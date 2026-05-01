# Authentication Module

## Purpose

This module governs user identity onboarding, role resolution, session continuity, and authorization readiness for internal academic operations.

## Notes

- Identity from the sign-in provider is normalized and merged into the internal user profile.
- Role assignment follows approved organization domain policy and is rejected when policy conditions are not met.
- Student identities can be enriched by matching institutional email patterns with student records.
- Session continuity uses short-lived access credentials and renewable credentials with strict rotation.
- Renewable credentials are centrally tracked and invalidated after use to reduce replay risk.
- Access is always evaluated against both session validity and account activity state.
- Administrative handling includes role governance, account state control, student data maintenance, and privileged mailbox grant management.

## Core Services

- Google service: orchestrates sign-in onboarding, profile enrichment, and initial credential issuance.
- Domain policy service: resolves identity role context from organization rules.
- Authentication service: handles issuance, renewal validation, and rotation enforcement.
- User service: manages user governance, lookup, filtering, and role updates.
- Student service: maintains student records and supports identity matching.
- Grant service: manages privileged mailbox grant state and synchronization bootstrap.
