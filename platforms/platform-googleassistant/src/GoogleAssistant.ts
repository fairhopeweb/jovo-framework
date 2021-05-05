import { App, ExtensibleConfig, HandleRequest, Platform } from '@jovotech/framework';
import {
  GoogleAssistantOutputTemplateConverterStrategy,
  GoogleAssistantResponse,
} from '@jovotech/output-googleassistant';
import { GoogleAction } from './GoogleAction';
import { GoogleAssistantRepromptComponent } from './GoogleAssistantRepromptComponent';
import { GoogleAssistantRequest } from './GoogleAssistantRequest';
import { GoogleAssistantUser } from './GoogleAssistantUser';

export interface GoogleAssistantConfig extends ExtensibleConfig {}

export class GoogleAssistant extends Platform<
  GoogleAssistantRequest,
  GoogleAssistantResponse,
  GoogleAction,
  GoogleAssistantConfig
> {
  outputTemplateConverterStrategy = new GoogleAssistantOutputTemplateConverterStrategy();
  requestClass = GoogleAssistantRequest;
  jovoClass = GoogleAction;
  userClass = GoogleAssistantUser;

  getDefaultConfig() {
    return {};
  }

  install(parent: App) {
    super.install(parent);
    parent.useComponents(GoogleAssistantRepromptComponent);

    parent.middlewareCollection.use('before.request', this.beforeRequest);
  }

  isRequestRelated(request: Record<string, any> | GoogleAssistantRequest): boolean {
    return request.user && request.session && request.handler && request.device;
  }

  isResponseRelated(response: Record<string, any> | GoogleAssistantResponse): boolean {
    return response.user && response.session && response.prompt;
  }

  finalizeResponse(
    response: GoogleAssistantResponse,
    googleAction: GoogleAction,
  ): GoogleAssistantResponse | Promise<GoogleAssistantResponse> {
    // TODO: check logic
    const requestSession = googleAction.$request.session;
    if (requestSession) {
      if (!response.session) {
        response.session = { ...requestSession, params: { ...googleAction.$session } };
      } else {
        response.session.params = { ...requestSession.params, ...googleAction.$session };
      }
    }
    return response;
  }

  beforeRequest = (handleRequest: HandleRequest, jovo: GoogleAction) => {
    // if the request is a no-input-request and a state exists, add the reprompt-component to the top
    if (
      jovo.$request.intent?.name &&
      [
        'actions.intent.NO_INPUT_1',
        'actions.intent.NO_INPUT_2',
        'actions.intent.NO_INPUT_FINAL',
      ].includes(jovo.$request.intent.name) &&
      jovo.$state
    ) {
      jovo.$state.push({
        componentPath: 'GoogleAssistantRepromptComponent',
      });
    }
  };
}