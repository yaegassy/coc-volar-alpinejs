import * as shared from '@volar/shared';
import { commands, DocumentSelector, ExtensionContext, LanguageClient, Thenable, workspace } from 'coc.nvim';
import * as initializeTakeOverMode from './client/commands/initializeTakeOverMode';
import * as documentVersion from './features/documentVersion';
import * as fileReferences from './features/fileReferences';
import * as showReferences from './features/showReferences';
import * as tsVersion from './features/tsVersion';

let apiClient: LanguageClient;
let docClient: LanguageClient | undefined;
let htmlClient: LanguageClient;

let resolveCurrentTsPaths: {
  serverPath: string;
  localizedPath: string | undefined;
  isWorkspacePath: boolean;
};

type CreateLanguageClient = (
  id: string,
  name: string,
  documentSelector: DocumentSelector,
  initOptions: shared.ServerInitializationOptions,
  port: number
) => LanguageClient;

let activated: boolean;

export async function activate(context: ExtensionContext, createLc: CreateLanguageClient): Promise<void> {
  /** MEMO: Custom commands for coc-volar-alpinejs */
  initializeTakeOverMode.register(context);

  //
  // For the first activation event
  //

  if (!activated) {
    const { document } = await workspace.getCurrentState();
    if (document.languageId === 'html') {
      doActivate(context, createLc);
      activated = true;
    }

    if (
      !activated &&
      ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
    ) {
      const takeOverMode = takeOverModeEnabled();
      if (takeOverMode) {
        doActivate(context, createLc);
        activated = true;
      }
    }
  }

  //
  // If open another file after the activation event
  //

  workspace.onDidOpenTextDocument(
    async () => {
      if (activated) return;

      const { document } = await workspace.getCurrentState();
      if (document.languageId === 'html') {
        doActivate(context, createLc);
        activated = true;
      }

      if (
        !activated &&
        ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
      ) {
        const takeOverMode = takeOverModeEnabled();
        if (takeOverMode) {
          doActivate(context, createLc);
          activated = true;
        }
      }
    },
    null,
    context.subscriptions
  );
}

export async function doActivate(context: ExtensionContext, createLc: CreateLanguageClient): Promise<void> {
  initializeWorkspaceState(context);

  const takeOverMode = takeOverModeEnabled();

  const languageFeaturesDocumentSelector: DocumentSelector = takeOverMode
    ? [
        { scheme: 'file', language: 'html' },
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescriptreact' },
        { scheme: 'file', language: 'json' },
      ]
    : [{ scheme: 'file', language: 'html' }];

  const documentFeaturesDocumentSelector: DocumentSelector = takeOverMode
    ? [
        { language: 'html' },
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'javascriptreact' },
        { language: 'typescriptreact' },
      ]
    : [{ language: 'html' }];

  const _useSecondServer = useSecondServer();

  apiClient = createLc(
    'volar-alpine-language-features',
    'Volar-Alpine - Language Features Server',
    languageFeaturesDocumentSelector,
    getInitializationOptions(context, 'main-language-features', _useSecondServer),
    6109
  );

  docClient = _useSecondServer
    ? createLc(
        'volar-alpine-language-features-2',
        'Volar-Alpine - Second Language Features Server',
        languageFeaturesDocumentSelector,
        getInitializationOptions(context, 'second-language-features', _useSecondServer),
        6110
      )
    : undefined;

  htmlClient = createLc(
    'volar-alpine-document-features',
    'Volar-Alpine - Document Features Server',
    documentFeaturesDocumentSelector,
    getInitializationOptions(context, 'document-features', _useSecondServer),
    6011
  );

  const clients = [apiClient, docClient, htmlClient].filter(shared.notEmpty);

  registerRestartRequest();
  registerClientRequests();

  fileReferences.register('volar.alpine.findAllFileReferences', apiClient);

  async function registerRestartRequest() {
    await Promise.all(clients.map((client) => client.onReady()));

    context.subscriptions.push(
      commands.registerCommand('volar.alpine.action.restartServer', async () => {
        await Promise.all(clients.map((client) => client.stop()));
        await Promise.all(clients.map((client) => client.start()));
        registerClientRequests();
      })
    );
  }

  function registerClientRequests() {
    for (const client of clients) {
      showReferences.activate(context, client);
      documentVersion.activate(context, client);
    }
  }
}

function getInitializationOptions(
  context: ExtensionContext,
  mode: 'main-language-features' | 'second-language-features' | 'document-features',
  useSecondServer: boolean
) {
  if (!resolveCurrentTsPaths) {
    resolveCurrentTsPaths = tsVersion.getCurrentTsPaths(context);
    context.workspaceState.update('coc-volar-alpine-ts-server-path', resolveCurrentTsPaths.serverPath);
  }

  const initializationOptions: shared.ServerInitializationOptions = {
    typescript: resolveCurrentTsPaths,
    languageFeatures:
      mode === 'main-language-features' || mode === 'second-language-features'
        ? {
            ...(mode === 'main-language-features'
              ? {
                  references: true,
                  implementation: true,
                  definition: true,
                  typeDefinition: true,
                  callHierarchy: true,
                  hover: true,
                  rename: true,
                  renameFileRefactoring: true,
                  signatureHelp: true,
                  codeAction: true,
                  workspaceSymbol: true,
                  completion: {
                    defaultTagNameCase: 'both',
                    defaultAttrNameCase: 'kebabCase',
                    getDocumentNameCasesRequest: false,
                    getDocumentSelectionRequest: false,
                  },
                  // schemaRequestService: true,
                  schemaRequestService: false,
                }
              : {}),
            ...(mode === 'second-language-features' || (mode === 'main-language-features' && !useSecondServer)
              ? {
                  documentHighlight: true,
                  documentLink: true,
                  // codeLens: { showReferencesNotification: true },
                  semanticTokens: true,
                  inlayHints: true,
                  diagnostics: getConfigDiagnostics(),
                  // schemaRequestService: true,
                  schemaRequestService: false,
                }
              : {}),
          }
        : undefined,
    documentFeatures:
      mode === 'document-features'
        ? {
            selectionRange: true,
            foldingRange: true,
            linkedEditingRange: true,
            documentSymbol: true,
            documentColor: true,
            documentFormatting: getConfigDocumentFormatting(),
          }
        : undefined,
  };

  return initializationOptions;
}

export function deactivate(): Thenable<any> | undefined {
  return Promise.all([apiClient?.stop(), docClient?.stop(), htmlClient?.stop()].filter(shared.notEmpty));
}

export function takeOverModeEnabled() {
  return !!workspace.getConfiguration('volar').get<boolean>('alpine.takeOverMode.enabled');
}

function useSecondServer() {
  return !!workspace.getConfiguration('volar').get<boolean>('alpineserver.useSecondServer');
}

function getConfigDiagnostics(): NonNullable<shared.ServerInitializationOptions['languageFeatures']>['diagnostics'] {
  const isDiagnosticsEnable = workspace.getConfiguration('volar').get<boolean>('alpine.diagnostics.enable', true);

  if (isDiagnosticsEnable) {
    return { getDocumentVersionRequest: true };
  } else {
    return undefined;
  }
}

function getConfigDocumentFormatting(): NonNullable<
  shared.ServerInitializationOptions['documentFeatures']
>['documentFormatting'] {
  const isFormattingEnable = workspace.getConfiguration('volar').get<boolean>('alipine.formatting.enable', true);

  if (isFormattingEnable) {
    return true;
  } else {
    return undefined;
  }
}

function initializeWorkspaceState(context: ExtensionContext) {
  context.workspaceState.update('coc-volar-alpine-ts-server-path', undefined);
}
