import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ABCWidgetFactory, DocumentRegistry, DocumentWidget,
} from '@jupyterlab/docregistry';

import {
  ICommandPalette, InstanceTracker
} from '@jupyterlab/apputils';

import {
  PathExt
} from '@jupyterlab/coreutils';

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  Widget
} from '@phosphor/widgets';

import {
  Message
} from '@phosphor/messaging';

import { read } from 'vega';

import { CreateVoyager, Voyager } from 'datavoyager';

import '../style/index.css';

const FACTORY = 'Xkcd';
/**
 * An xckd comic viewer.
 */
class XkcdWidget extends DocumentWidget<Widget> {
  /**
   * Construct a new xkcd widget.
   */
  constructor(options: DocumentWidget.IOptions<Widget>) {
    super({ ...options });
    console.log("XkcdWidget::constructor", options);

    this._onTitleChanged();
    this.context.pathChanged.connect(this._onTitleChanged, this);
    this.context.ready.then(() => { this._onContextReady(); });
  }

  protected onAfterShow(msg: Message): void {
    console.log("XkcdWidget::onAfterShow")
    this._loadEditor(this.node);
    this._onContentChanged();
  }

  private _loadEditor(node: HTMLElement): void {
    this._editor = CreateVoyager(node, {
      showDataSourceSelector: false,
      serverUrl: null,
      hideHeader: true,
      hideFooter: true,
      relatedViews: "initiallyCollapsed",
      wildcards: "enabled"
    }, undefined)
  }

  private _onContextReady(): void {
    console.log("XkcdWidget::_onContextReady");

    // Set the editor model value.
    this._onContentChanged();
  }

  private _onTitleChanged(): void {
    this.title.label = PathExt.basename(this.context.localPath);
  }

  private _onContentChanged(): void {
    if (!this._editor) {
      return;
    }

    const values = read(this.context.model.toString(), { type: 'csv', parse: 'auto' });
    console.log(values);
    this._editor.updateData(values);
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  readonly context: DocumentRegistry.Context;
  private _editor: Voyager;
  private _ready = new PromiseDelegate<void>();

};

export
  class XkcdFactory extends ABCWidgetFactory<XkcdWidget, DocumentRegistry.IModel> {
  /**
  * Create a new widget given a context.
  */
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    super(options);
    console.log("XkcdFactory::constructor", options);
  }

  protected createNewWidget(context: DocumentRegistry.Context): XkcdWidget {
    console.log("XkcdFactory::createNewWidget", context.path);
    return new XkcdWidget({ context, content: new Widget() });
  }
}


/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  console.log('JupyterLab extension jupyterlab_xkcd is activated!', app, palette, restorer);
  const namespace = 'xkcd';
  const factory = new XkcdFactory({ name: FACTORY, fileTypes: ['csv'] });
  const tracker = new InstanceTracker<XkcdWidget>({ namespace });
  // Handle state restoration.
  restorer.restore(tracker, {
    command: 'docmanager:open',
    args: widget => ({ path: widget.context.path, factory: FACTORY }),
    name: widget => widget.context.path
  });

  factory.widgetCreated.connect((sender, widget) => {
    widget.context.pathChanged.connect(() => {
      tracker.save(widget);
    });
    tracker.add(widget);
  });

  app.docRegistry.addWidgetFactory(factory);
};


/**
 * Initialization data for the jupyterlab_xkcd extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_xkcd',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: activate
};

export default extension;
