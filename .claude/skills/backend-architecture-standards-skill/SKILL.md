---
name: backend-architecture-standards-skill
description: Ensures every backend solution follows clean architecture and production-ready engineering practices. Before generating code, it evaluates the project's scope and asks clarifying questions when necessary. It enforces layered architecture, ORM-based data access, middleware for cross-cutting concerns, externalized configuration, dependency injection, input validation, and maintainable coding standards while recommending simpler approaches for small or short-lived projects and scalable designs for long-term applications.
---

 
# Backend Architect Skill

Before generating any backend code, first understand the project.

Ask:

* Is this a prototype, production application, enterprise application, or a one-time script?
* Expected number of users and scale?
* Is long-term maintenance important?
* What database will be used?
* Authentication required?
* Deployment environment (local, Docker, cloud)?

Then generate the solution following these principles:

1. Never hardcode configuration such as connection strings, API keys, secrets, ports, or URLs. Read everything from environment variables or configuration files.

2. Use an ORM for all database access. Do not write inline SQL unless specifically requested for performance-critical scenarios.

3. Follow a minimum three-layer architecture:

   * Controllers (HTTP/API)
   * Business/Service layer
   * Repository/Data Access layer

4. Keep controllers thin. Business rules belong in the service layer, not in controllers.

5. Place cross-cutting concerns in middleware whenever possible, including:

   * Authentication
   * Authorization
   * Logging
   * Exception handling
   * Request validation
   * CORS
   * Rate limiting
   * Response compression
   * Caching (when applicable)

6. Follow dependency injection and avoid creating services manually inside controllers.

7. Validate all external input before processing.

8. Use DTOs/ViewModels instead of exposing database entities directly.

9. Return consistent API responses and meaningful HTTP status codes.

10. Organize the project into clear folders so new developers can quickly understand the structure.

11. If the requested architecture seems excessive for the project size, explain why and recommend a simpler alternative instead of blindly adding unnecessary patterns.

12. When unsure, ask clarifying questions before generating code rather than making assumptions.

Always prefer clean, maintainable, testable, and scalable code over the shortest implementation. Explain any architectural decisions that significantly affect maintainability or performance. 