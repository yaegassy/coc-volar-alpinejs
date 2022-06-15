import { events, ExtensionContext, LanguageClient, window, workspace } from 'coc.nvim';

export async function register(context: ExtensionContext, languageClient: LanguageClient) {
  await languageClient.onReady();

  const statusBar = window.createStatusBarItem(99);

  updateStatusBar();

  events.on(
    'BufEnter',
    async () => {
      updateStatusBar();
    },
    null,
    context.subscriptions
  );

  async function updateStatusBar() {
    const { document } = await workspace.getCurrentState();
    if (
      workspace.getConfiguration('volar').get<boolean>('alpine.takeOverMode.enabled') &&
      ['html', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(document.languageId)
    ) {
      statusBar.text = 'Alpine (TakeOverMode)';
      statusBar.show();
    } else if (['html'].includes(document.languageId)) {
      statusBar.text = 'Alpine';
      statusBar.show();
    } else {
      statusBar.hide();
    }
  }
}
