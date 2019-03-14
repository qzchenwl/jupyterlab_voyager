import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  ABCWidgetFactory, DocumentRegistry, IDocumentWidget, DocumentWidget,
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
  Widget, // BoxLayout
} from '@phosphor/widgets';

import {
  Message
} from '@phosphor/messaging';

import {
  read
} from 'vega';

import {
  CreateVoyager, Voyager
} from 'datavoyager';

import "datavoyager/build/style.css";

import '../style/index.css';

const FACTORY = 'Xkcd';
/**
 * An xckd comic viewer.
 */
class XkcdWidget extends Widget {
  /**
   * Construct a new xkcd widget.
   */
  constructor(context: DocumentRegistry.Context) {
    super();
    console.log("XkcdWidget::constructor", context);
    this._context = context;

    this._onTitleChanged();
    this._context.pathChanged.connect(this._onTitleChanged, this);
    this._context.ready.then(() => { this._onContextReady(); });
  }

  protected onAfterShow(msg: Message): void {
    console.log("XkcdWidget::onAfterShow");
    this._loadVoyager(this.node);
    this._onContentChanged();
  }

  private _loadVoyager(node: HTMLElement): void {
    this._voyager = CreateVoyager(node, {
      showDataSourceSelector: false,
      serverUrl: null,
      hideHeader: true,
      hideFooter: true,
      relatedViews: "initiallyCollapsed",
      wildcards: "enabled"
    }, { values: [] });
    console.log("voyager XXXXXXXXXXXXXX", this._voyager);
  }

  private _onContextReady(): void {
    console.log("XkcdWidget::_onContextReady");
    this._onContentChanged();
  }

  private _onTitleChanged(): void {
    this.title.label = PathExt.basename(this._context.localPath);
  }

  private _onContentChanged(): void {
    if (!this._voyager) {
      return;
    }

    const values = read(this._context.model.toString(), { type: 'csv', parse: 'auto' });
    console.log(values);
    this._voyager.updateData({ values });
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  private _context: DocumentRegistry.Context;
  private _voyager: Voyager;
  private _ready = new PromiseDelegate<void>();

};

export
  class XkcdFactory extends ABCWidgetFactory<IDocumentWidget<XkcdWidget>> {
  /**
  * Create a new widget given a context.
  */
  constructor(options: DocumentRegistry.IWidgetFactoryOptions) {
    console.log("XkcdFactory::constructor", options);
    super(options);
  }

  protected createNewWidget(context: DocumentRegistry.IContext<DocumentRegistry.IModel>): IDocumentWidget<XkcdWidget> {
    console.log("XkcdFactory::createNewWidget", context.path);
    return new DocumentWidget({ context, content: new XkcdWidget(context) });
  }
}


/**
 * Activate the xckd widget extension.
 */
function activate(app: JupyterLab, palette: ICommandPalette, restorer: ILayoutRestorer) {
  console.log('JupyterLab extension jupyterlab_xkcd is activated!', app, palette, restorer);
  const namespace = 'xkcd';
  const factory = new XkcdFactory({ name: FACTORY, fileTypes: ['csv'] });
  const tracker = new InstanceTracker<IDocumentWidget<XkcdWidget>>({ namespace });
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
