import { app, HttpHandler, HttpRequest, HttpResponse, InvocationContext } from '@azure/functions';
import * as df from 'durable-functions';
import { ActivityHandler, OrchestrationContext, OrchestrationHandler } from 'durable-functions';
import { createActor } from 'xstate';
import { creditCheckMachine } from './creditCheckMachine';

const activityName = 'startApplication';

const startApplicationOrchestrator: OrchestrationHandler = function* (context: OrchestrationContext) {
    const creditCheckActor = createActor(creditCheckMachine);
};
df.app.orchestration('startApplicationOrchestrator', startApplicationOrchestrator);

const startApplication: ActivityHandler = (input: string): string => {
    return `Hello, ${input}`;
};
df.app.activity(activityName, { handler: startApplication });

const startApplicationHttpStart: HttpHandler = async (request: HttpRequest, context: InvocationContext): Promise<HttpResponse> => {
    const client = df.getClient(context);
    const body: unknown = await request.text();
    const instanceId: string = await client.startNew(request.params.orchestratorName, { input: body });

    context.log(`Started orchestration with ID = '${instanceId}'.`);

    return client.createCheckStatusResponse(request, instanceId);
};  

app.http('startApplicationHttpStart', {
    route: 'orchestrators/{orchestratorName}',
    extraInputs: [df.input.durableClient()],
    handler: startApplicationHttpStart,
});