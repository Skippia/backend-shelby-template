## Arсhitecture (simplified)

- Based on [clean architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) and [hexagonal architecture](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software))

### Domain layer

- **Entities** (domain entity) — contain concrete classes with properties and behaviors (only if we follow to the `rich-entity model` (we use here `anemic-entity model` => our entities don't have any behavior)) relevant to domain. They don't depend on anything.

- **RepositoryInterfaces** — interfaces for access DB (it can be located also in application layer, but here we consider that repository is part of business logic).

- **Helpers** - any additional information related with domain (types, enums, constants).

-----------------

- Domain services (optional) — are concrete classes which contain business rules which does not fit within a domain model (accept entities as argument and manage it).

- Value objects (optional) — are immutable values without identity. They represent the primitives of your domain entity, such as dates, times, coordinates, or currencies.

- Aggregate (optional) — aggregates create relationships between entities and value objects. They represent a group of objects that can be treated as a single unit and are always in a consistent state.

- Factories (optional) — are responsible for creating new aggregates.

- Domain events (optional) — contain only domain event POCO.

- Domain exceptions (optional) - exceptions related with domain model


### Application Layer:

- **Ports** — contain interfaces for `application services` (will be used within usecases) usually these services produce side effects (external communication) [f.e: Notifactions, EmailSender, ...].

- **Usecases** — are orchestrators over `application services` and `domain entities`. Contain application / business logic [f.e: RegisterLocalUsecase, SigninUsecase, ...].

- **Exceptions** — specific exceptions related with specific usecases.

-----------------

- Event Bus (optional) — interfaces for implementing event bus.


### Presenter

- **DTO** — mapper between `Usecases` and `External world` returning / transforming data (without exposing the domain entities) to external world (will be used in controllers).

- **Controllers** — are orchestrators over the usecases (use `dto mapper` to transform usecases input/output to DTO (dto for external world) and vice versa).

### Infra

- **Adapters** — implementation of ports from application layer [OneSignalNotificator, GmailSender, ...].

- **Database** — connection to database, database schema and migrations.

- **Repository** — implementation of repositoryInterfaces from domain layer.

- **Mapper** — implementation for mapper between `EntityDomain` and `EntityDatabase` .Are utilized for mapping data between `persistence layer (repository)` and `database` (get / create data).

### Communication between layers

    [Database -> `DatabaseMapper(Database <--> Application)` <- Persistence] <-> `Application` <-> [Presenter -> `DtoMapper(Application <--> UI)` <- UI]

# Some wisdom

- `Repository` always accepts and returns only `EntityDomain` model (but under the hood uses database mapper in order to work with database)

- `Presentation Layer` should access the `domain model` only through the `Application Layer`

- About `external DTO`:
  - If the DTOs are only for presentation purposes, then the Presentation Layer is a good choice.
  - If they are part of an API, be it for input or output, that is an Application Layer concern.

- Remember, the point of layering is that you're trying to protect high-level abstraction (like business/domain objects) from changes in low-level implementation details. Not the other way around.
  In short, you want to minimize the amount of code you'd rewrite if you changed (for example) your api from REST to something else.
  So it's perfectly fine for the lower-level layer (the implementation details) to know all about the higher-level code.

- `Ports` are created to fit the Application Core needs and not simply mimic the tools APIs. 

- The role of an `Application Service` is to:
    - use a repository to find one or several entities;
    - tell those entities to do some domain logic;
    - use the repository to persist the entities again, effectively saving the data changes.

- The `adapters` depend on a specific tool and a specific `port` (by implementing an interface). But our business logic only depends on the port (interface).
