import { test, describe } from "node:test";
import assert from "node:assert/strict";

function createMockServer() {
  const tools = {};
  return {
    tool: (name, description, schema, handler) => {
      tools[name] = { name, description, schema, handler };
    },
    tools,
  };
}

describe("actor analytics tools", () => {
  test("get_active_actors is registered with site and period", async () => {
    const server = createMockServer();
    const { registerActorTools } = await import("../dist/tools/actors.js");
    registerActorTools(server);
    assert.ok(server.tools.get_active_actors, "get_active_actors should be registered");
    assert.ok(server.tools.get_active_actors.schema.site);
    assert.ok(server.tools.get_active_actors.schema.period);
    assert.ok(server.tools.get_active_actors.schema.limit);
  });

  test("get_actor_activity requires actor param", async () => {
    const server = createMockServer();
    const { registerActorTools } = await import("../dist/tools/actors.js");
    registerActorTools(server);
    assert.ok(server.tools.get_actor_activity, "get_actor_activity should be registered");
    assert.ok(server.tools.get_actor_activity.schema.actor, "should have actor param");
    assert.ok(server.tools.get_actor_activity.schema.site);
  });

  test("get_actor_retention is registered with site and period", async () => {
    const server = createMockServer();
    const { registerActorTools } = await import("../dist/tools/actors.js");
    registerActorTools(server);
    assert.ok(server.tools.get_actor_retention, "get_actor_retention should be registered");
    assert.ok(server.tools.get_actor_retention.schema.site);
    assert.ok(server.tools.get_actor_retention.schema.period);
  });
});
