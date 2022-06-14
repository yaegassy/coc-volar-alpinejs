import {
  ExtensionContext,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  Thenable,
  TransportKind,
  workspace,
} from 'coc.nvim';
import * as path from 'path';
import { activate as commonActivate, deactivate as commonDeactivate } from './common';

let serverModule: string;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!getConfigVolarAlpineEnable()) return;

  return commonActivate(context, (id, name, documentSelector, initOptions, port) => {
    serverModule = context.asAbsolutePath(
      path.join('node_modules', '@volar', 'alpine-language-server', 'bin', 'alpine-language-server.js')
    );

    const debugOptions = { execArgv: ['--nolazy', '--inspect=' + port] };
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions,
      },
    };

    const memorySize = Math.floor(Number(getConfigServerMaxOldSpaceSize()));
    if (memorySize && memorySize >= 256) {
      const maxOldSpaceSize = '--max-old-space-size=' + memorySize.toString();
      serverOptions.run.options = { execArgv: [maxOldSpaceSize] };
      if (serverOptions.debug.options) {
        if (serverOptions.debug.options.execArgv) {
          serverOptions.debug.options.execArgv.push(maxOldSpaceSize);
        }
      }
    }

    const clientOptions: LanguageClientOptions = {
      documentSelector,
      initializationOptions: initOptions,
      progressOnInitialization: getConfigProgressOnInitialization(),
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('{**/*.html,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.json}'),
      },
    };

    const client = new LanguageClient(id, name, serverOptions, clientOptions);
    context.subscriptions.push(client.start());

    return client;
  });
}

export function deactivate(): Thenable<any> | undefined {
  return commonDeactivate();
}

function getConfigVolarAlpineEnable() {
  return workspace.getConfiguration('volar').get<boolean>('alpine.enable', true);
}

function getConfigProgressOnInitialization() {
  return workspace.getConfiguration('volar').get<boolean>('alpine.progressOnInitialization.enable', true);
}

function getConfigServerMaxOldSpaceSize() {
  return workspace.getConfiguration('volar').get<number | null>('alpineserver.maxOldSpaceSize');
}
