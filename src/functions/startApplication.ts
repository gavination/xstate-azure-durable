import {
  app,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  InvocationContext,
} from "@azure/functions";
import * as df from "durable-functions";
import {
  ActivityHandler,
  OrchestrationContext,
  OrchestrationHandler,
} from "durable-functions";
import { ActorStatus, createActor } from "xstate";
import { creditCheckMachine } from "./creditCheckMachine";
import { z } from "zod";
const activityName = "startApplication";

const startCreditCheckOrchestrator: OrchestrationHandler = function* (
  context: OrchestrationContext
) {
  // kick up an instance of the credit check actor
  console.log("I'm awake!");
  const input = JSON.parse(context.df.getInput());
  console.log("input: ", input);
  const creditCheckActor = createActor(creditCheckMachine, {
    input: input,
    id: context.df.instanceId,
  });
  creditCheckActor.start();

  // explicitly look for actor's state if it exists
  // in theory, we shouldn't have to do this. let's see!
  console.log("current actor state: ", creditCheckActor.getPersistedState());
  console.log("current actor status: ", creditCheckActor.status);

  // wait for an event to be received...
  const creditCheckEvent = yield context.df.waitForExternalEvent(
    "UpdateCreditCheck"
  );
  console.log("event reeived: ", creditCheckEvent);
  const creditCheckEventPayload = JSON.parse(creditCheckEvent);
  creditCheckActor.send(creditCheckEventPayload);

  console.log("current actor state: ", creditCheckActor.getPersistedState());
};
df.app.orchestration(
  "startCreditCheckOrchestrator",
  startCreditCheckOrchestrator
);

const startApplication: ActivityHandler = (input: string): string => {
  return `Hello, ${input}`;
};
df.app.activity(activityName, { handler: startApplication });

const startApplicationHttpStart: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponse> => {
  const client = df.getClient(context);
  const body: unknown = await request.text();
  const instanceId: string = await client.startNew(
    request.params.orchestratorName,
    { input: body }
  );

  context.log(`Started orchestration with ID = '${instanceId}'.`);

  return client.createCheckStatusResponse(request, instanceId);
};

const updateCreditCheckOrchestrator: HttpHandler = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponse> => {
  const client = df.getClient(context);
  const body: unknown = await request.text();

  try {
    //some zod validation here
    const eventPayloadSchema = z
      .object({
        type: z.string({
          required_error:
            "You must provide an event type for the event payload",
        }),
        instanceId: z.string({
          required_error:
            "You must provide an instanceId for the event payload",
        }),
      })
      .parse(body);

    // check if instanceId exists
    const instanceId: string = request.params.instanceId;
    const status = await client.getStatus(instanceId);

    if (status.runtimeStatus === df.OrchestrationRuntimeStatus.Running) {
      await client.raiseEvent(instanceId, "UpdateCreditCheck", {
        type: eventPayloadSchema.type,
      });

      return client.createCheckStatusResponse(request, instanceId);
    } else {
      const error = new Error("Orchestration is not running");
      return client.createCheckStatusResponse(request, error.message);
    }
  } catch (error) {
    context.log(error);
    client.createCheckStatusResponse(request, error);
  }
};

app.http("startApplicationHttpStart", {
  route: "orchestrators/{orchestratorName}",
  extraInputs: [df.input.durableClient()],
  handler: startApplicationHttpStart,
});

app.http("updateCreditCheckOrchestrator", {
  route: "orchestrators/update",
  extraInputs: [df.input.durableClient()],
  handler: updateCreditCheckOrchestrator,
});
