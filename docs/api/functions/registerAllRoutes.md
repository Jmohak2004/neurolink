[**NeuroLink API Reference**](../README.md)

---

[NeuroLink API Reference](../README.md) / registerAllRoutes

# Function: registerAllRoutes()

> **registerAllRoutes**(`adapter`, `basePath?`, `options?`): `void`

Register all routes with a server adapter

With `options.perUserAuth` this also turns on the adapter's
`carryMiddlewareState` (`enableMiddlewareStateCarry()`): the agent routes can
only take identity from `ctx.user` if the adapter hands the handler what
authentication middleware set. An adapter without that method carries state
itself, or the routes see no user.

## Parameters

### adapter

#### registerRouteGroup

(`group`) => `void`

#### listRoutes?

() => [`RouteDefinition`](../type-aliases/RouteDefinition.md)[]

#### enableMiddlewareStateCarry?

() => `void`

### basePath?

`string` = `"/api"`

### options?

[`CreateRoutesOptions`](../type-aliases/CreateRoutesOptions.md)

## Returns

`void`
