// @microsoft/agents-copilotstudio-client'in DEMO karşılığı. Gerçek bir Copilot Studio'ya bağlanmaz;
// yanıtlar veri setindeki senaryodan gelir (demo/mock/copilot.js).
import { FakeCopilotClient } from "../mock/copilot.js"

export class ConnectionSettings {
  constructor(options = {}) {
    Object.assign(this, options)
  }
}

export class CopilotStudioClient extends FakeCopilotClient {
  constructor(settings, token) {
    super(settings)
    this.token = token
  }
}
